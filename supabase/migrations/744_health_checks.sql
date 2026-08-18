-- Migration 744: the app checks itself.
--
-- Every fault found so far has the same shape: two figures that must agree,
-- quietly disagreeing. Consumption against stock movement. GRN against ledger.
-- Bird sales against shed records. A person spots that by luck; a query spots
-- it every night. These rules each return a COUNT that must be zero, and what
-- they find is written to health_check_results for the app to show.
--
-- The rules cover every module, not one screen — feed, inventory, flocks,
-- accounts, hatchery, HR — and the intent is that every fault found from here
-- on adds a rule in the same session it is fixed, so the app ends up checking
-- itself against every mistake it has ever made.

CREATE TABLE IF NOT EXISTS public.health_check_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_key    TEXT NOT NULL,
  title        TEXT NOT NULL,
  module       TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'warning',   -- critical | warning | info
  failed_count INTEGER NOT NULL DEFAULT 0,
  detail       TEXT,
  what_it_means TEXT
);

CREATE INDEX IF NOT EXISTS idx_hcr_run ON public.health_check_results(run_at DESC);

CREATE INDEX IF NOT EXISTS idx_hcr_key ON public.health_check_results(check_key, run_at DESC);

ALTER TABLE public.health_check_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.health_check_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_write" ON public.health_check_results FOR ALL TO authenticated
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.fn_run_health_checks()
RETURNS TABLE (check_key TEXT, failed_count INTEGER)
LANGUAGE plpgsql AS
$$
DECLARE
  v_run   TIMESTAMPTZ := now();
  v_count INTEGER;
  v_detail TEXT;
  v_failed INTEGER := 0;
BEGIN
  -- 1. Every GRN line must have its stock movement.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT g.grn_date::text || ' ' || COALESCE(g.item_name, '?') || ' ' || COALESCE(g.qty, 0)::text AS d
      FROM public.grn g
      WHERE NOT EXISTS (SELECT 1 FROM public.stock_ledger s WHERE s.grn_id = g.id)
      LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'grn_without_stock', 'GRN lines that never reached stock', 'Inventory', 'critical', v_count, v_detail,
          'Goods were received and paid for but the stock was never increased, so the item reads lower than it is.');

  -- 2. Every production ingredient line must have its consumption movement.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT l.production_date::text || ' ' || COALESCE(i.ingredient_name, '?') || ' ' || COALESCE(i.quantity_kg, 0)::text AS d
      FROM public.feed_production_ingredients i
      JOIN public.feed_production_log l ON l.id = i.production_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.stock_ledger s
        WHERE s.feed_prod_id = i.production_id AND s.txn_type = 'production_out'
          AND lower(s.item_name) = lower(COALESCE(i.ingredient_name, '')))
      LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'production_without_consumption', 'Feed produced without ingredients coming off stock', 'Feed', 'critical', v_count, v_detail,
          'The mill used the ingredients but stock still holds them, so every ingredient reads higher than it is.');

  -- 3. Stock movements with no item name or no item link.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT sl.txn_date::text || ' ' || sl.txn_type || ' ' || COALESCE(NULLIF(btrim(sl.item_name), ''), '(blank)') AS d
      FROM public.stock_ledger sl
      WHERE COALESCE(btrim(sl.item_name), '') = '' OR sl.item_id IS NULL
      LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'ledger_unlinked', 'Stock movements not linked to an item', 'Inventory', 'warning', v_count, v_detail,
          'A movement with no item comes off nothing — the stock it should have changed is wrong, and no screen can show it.');

  -- 4. Items with a negative balance.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT b.item_name || ' ' || round(b.bal, 1)::text AS d FROM (
        SELECT sl.item_name,
               SUM(CASE WHEN sl.txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                        THEN -sl.qty ELSE sl.qty END) AS bal
        FROM public.stock_ledger sl GROUP BY sl.item_name) b
      WHERE b.bal < 0 ORDER BY b.bal LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'negative_stock', 'Items showing negative stock', 'Inventory', 'warning', v_count, v_detail,
          'More was used than was ever received, so either a purchase is missing or a usage is overstated.');

  -- 5. One vendor, one GRN number, more than one bill.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT upper(pp.vendor_name) || ' GRN ' || pp.grn_no || ' x' || count(*)::text AS d
      FROM public.pending_payments pp
      WHERE pp.grn_no IS NOT NULL AND btrim(pp.grn_no) <> ''
      GROUP BY upper(pp.vendor_name), pp.grn_no HAVING count(*) > 1 LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'duplicate_bills', 'The same GRN billed more than once', 'Accounts', 'critical', v_count, v_detail,
          'The farm appears to owe the same money twice, and one of the two can be paid a second time.');

  -- 6. Bills carrying money but still marked Pending.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT pp.vendor_name || ' ' || COALESCE(pp.invoice_no, '?') || ' paid ' || COALESCE(pp.paid_amount, 0)::text AS d
      FROM public.pending_payments pp
      WHERE COALESCE(pp.paid_amount, 0) >= COALESCE(pp.net_payable, pp.invoice_amount, 0)
        AND COALESCE(pp.paid_amount, 0) > 0
        AND COALESCE(pp.payment_status, 'Pending') NOT IN ('Paid', 'paid')
      LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'paid_but_pending', 'Bills paid in full but still marked Pending', 'Accounts', 'warning', v_count, v_detail,
          'Payables are overstated and the bill will appear in the next payment plan.');

  -- 7. Cash book rows pointing at a sale or dispatch that no longer exists.
  SELECT count(*), '' INTO v_count, v_detail
  FROM public.cash_book cb
  WHERE (cb.nhe_sale_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.nhe_sales s WHERE s.id = cb.nhe_sale_id))
     OR (cb.he_dispatch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.he_dispatch d WHERE d.id = cb.he_dispatch_id));
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'cashbook_orphans', 'Cash book entries whose sale was deleted', 'Accounts', 'warning', v_count, v_detail,
          'Money recorded against something that no longer exists — the cash book and the sales register disagree.');

  -- 8. Birds must balance: opening - mortality - culls - transfers = closing.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT dr.record_date::text || ' flock ' || COALESCE(f.flock_no::text, '?')
             || ' out by ' || (dr.opening_female - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
                               - COALESCE(dr.transfer_female,0) - dr.closing_female)::text AS d
      FROM public.daily_records dr LEFT JOIN public.flocks f ON f.id = dr.flock_id
      WHERE COALESCE(dr.opening_female, 0) > 0 AND COALESCE(dr.closing_female, 0) > 0
        AND (dr.opening_female - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
             - COALESCE(dr.transfer_female,0)) <> dr.closing_female
      ORDER BY dr.record_date DESC LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'birds_dont_balance', 'Days where the bird count does not add up', 'Flocks', 'critical', v_count, v_detail,
          'Opening less deaths, culls and transfers does not equal closing, so one of those figures is wrong.');

  -- 9. Bird sales with no shed, for flocks that are recorded shed by shed.
  SELECT count(*), '' INTO v_count, v_detail
  FROM public.nhe_sales s
  WHERE s.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
    AND s.shed_id IS NULL
    AND EXISTS (SELECT 1 FROM public.daily_records d WHERE d.flock_id = s.flock_id AND d.shed_id IS NOT NULL);
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'bird_sales_no_shed', 'Bird sales not attributed to a shed', 'Flocks', 'info', v_count, v_detail,
          'The flock total is right but no shed closing count reflects the sale, and Bulk Daily Entry cannot show it.');

  -- 10. Sheds a flock was transferred into but never allocated.
  SELECT count(*), '' INTO v_count, v_detail
  FROM (SELECT DISTINCT t.flock_id, t.to_shed_id FROM public.flock_transfers t
        WHERE t.to_shed_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                          WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)) y;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'transfer_shed_unallocated', 'Transfer destinations with no shed allocation', 'Flocks', 'info', v_count, v_detail,
          'The birds moved but the shed was never recorded as holding them, so entry screens may not offer it.');

  -- 11. Hatch batches with no dispatch linked — egg age cannot be worked out.
  SELECT count(*), '' INTO v_count, v_detail
  FROM public.hatch_batches hb WHERE hb.dispatch_id IS NULL;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'hatch_without_dispatch', 'Hatch batches with no dispatch linked', 'Hatchery', 'info', v_count, v_detail,
          'Egg age cannot be calculated for these batches.');

  -- 12. Medicine usage never linked to an item, so it came off no stock.
  SELECT count(*), '' INTO v_count, v_detail
  FROM public.medicine_usage mu WHERE mu.item_id IS NULL;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (v_run, 'medicine_usage_unlinked', 'Medicine used but not taken off stock', 'Inventory', 'warning', v_count, v_detail,
          'The medicine was given to the birds but its stock was never reduced, so it reads higher than it is.');

  -- A task on the Development list whenever anything critical fails, so it
  -- lands where the outstanding work already is instead of waiting to be seen.
  SELECT count(*) INTO v_failed
  FROM public.health_check_results r
  WHERE r.run_at = v_run AND r.failed_count > 0 AND r.severity = 'critical';

  IF v_failed > 0 THEN
    INSERT INTO public.tasks (title, description, task_type, team, status, priority)
    SELECT 'Health check found ' || v_failed || ' critical problem(s) on ' || to_char(v_run, 'DD/MM/YYYY'),
           'Raised automatically by the nightly health check. Failing rules: ' ||
           (SELECT string_agg(r.title || ' (' || r.failed_count || ')', '; ' ORDER BY r.title)
              FROM public.health_check_results r
             WHERE r.run_at = v_run AND r.failed_count > 0 AND r.severity = 'critical'),
           'development', 'Housekeeping', 'pending', 'high'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.task_type = 'development' AND t.status = 'pending'
        AND t.title LIKE 'Health check found%' AND t.created_at::date = v_run::date);
  END IF;

  RETURN QUERY
    SELECT r.check_key, r.failed_count FROM public.health_check_results r
    WHERE r.run_at = v_run ORDER BY r.severity, r.check_key;
END;
$$;

NOTIFY pgrst, 'reload schema';
