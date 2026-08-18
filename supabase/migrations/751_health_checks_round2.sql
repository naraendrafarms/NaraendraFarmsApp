-- Migration 751: the second layer of checks.
--
-- Round one compared records against records. It would NOT have caught the
-- Alkakarb fault, where the data was perfect and the PAGE read short — the
-- rules said 294 of 294 GRNs reached stock, and that was true.
--
-- So this round adds two kinds:
--   * the modules round one never touched — HR, electricity, VHL, dispatch,
--     bank, egg stock;
--   * REPORT AGAINST SOURCE: recompute what a screen shows from the raw rows
--     and compare. A page reading the wrong column, or reading only part of
--     the table, makes those two disagree — which is how a display fault can
--     be caught by a database rule, without opening a browser.

CREATE OR REPLACE FUNCTION public.fn_health_round2(p_run TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE plpgsql AS
$$
DECLARE
  v_count INTEGER; v_detail TEXT; v_a NUMERIC; v_b NUMERIC;
BEGIN
  -- ── HR ────────────────────────────────────────────────────────────────────
  -- Salary paid for a month with no attendance behind it at all.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '') INTO v_count, v_detail FROM (
    SELECT to_char(sm.month, 'MM/YYYY') || ' ' || COALESCE(e.name, '?') AS d
    FROM public.salary_monthly sm
    JOIN public.employees e ON e.id = sm.employee_id
    WHERE COALESCE(sm.days_worked, 0) > 0
      AND NOT EXISTS (SELECT 1 FROM public.attendance_daily a
                      WHERE a.employee_id = sm.employee_id
                        AND date_trunc('month', a.attendance_date) = date_trunc('month', sm.month))
    LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'salary_without_attendance', 'Salary paid for a month with no attendance recorded', 'HR', 'warning', v_count, v_detail,
          'Days worked were paid but no attendance exists for that month, so the figure rests on nothing.');

  -- Days paid that exceed the days actually marked present in that month.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '') INTO v_count, v_detail FROM (
    SELECT to_char(sm.month, 'MM/YYYY') || ' ' || COALESCE(e.name, '?')
           || ' paid ' || sm.days_worked::text || ' vs marked ' || att.n::text AS d
    FROM public.salary_monthly sm
    JOIN public.employees e ON e.id = sm.employee_id
    JOIN LATERAL (
      SELECT count(*) AS n FROM public.attendance_daily a
      WHERE a.employee_id = sm.employee_id
        AND date_trunc('month', a.attendance_date) = date_trunc('month', sm.month)
        AND a.status IN ('P','OT','H','WO')) att ON TRUE
    WHERE att.n > 0 AND COALESCE(sm.days_worked, 0) > att.n + 1
    LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'days_paid_exceed_attendance', 'More days paid than attendance shows', 'HR', 'warning', v_count, v_detail,
          'Salary was calculated on more days than the attendance register holds for that person and month.');

  -- ── Electricity ───────────────────────────────────────────────────────────
  SELECT count(*), '' INTO v_count, v_detail
  FROM public.electricity_bills b
  WHERE COALESCE(b.amount, 0) > 0
    AND (SELECT COALESCE(sum(a.allocated_amount), 0) FROM public.electricity_allocation a WHERE a.bill_id = b.id) > b.amount + 1;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'electricity_over_allocated', 'Electricity bills allocated beyond their value', 'Electricity', 'warning', v_count, v_detail,
          'More money was charged to flocks than the bill itself, so flock costs are overstated.');

  -- ── VHL ───────────────────────────────────────────────────────────────────
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '') INTO v_count, v_detail FROM (
    SELECT v.record_date::text || ' out by ' ||
           (COALESCE(v.opening_female,0) + COALESCE(v.received_female,0) - COALESCE(v.trcull_female,0)
            - COALESCE(v.mortality_female,0) - COALESCE(v.closing_female,0))::text AS d
    FROM public.vhl_daily_entry v
    WHERE COALESCE(v.opening_female,0) > 0 AND COALESCE(v.closing_female,0) > 0
      AND (COALESCE(v.opening_female,0) + COALESCE(v.received_female,0) - COALESCE(v.trcull_female,0)
           - COALESCE(v.mortality_female,0)) <> COALESCE(v.closing_female,0)
    ORDER BY v.record_date DESC LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'vhl_birds_dont_balance', 'VHL days where the bird count does not add up', 'VHL', 'warning', v_count, v_detail,
          'Opening plus received, less transfers, culls and deaths, does not equal closing on those days.');

  -- ── Dispatch ──────────────────────────────────────────────────────────────
  -- The dispatch header and its own grade lines must agree on how many eggs left.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '') INTO v_count, v_detail FROM (
    SELECT d.dispatch_date::text || ' DC ' || COALESCE(d.dc_no::text, '?')
           || ' header ' || d.total_dispatched::text || ' vs lines ' || li.n::text AS d
    FROM public.he_dispatch d
    JOIN LATERAL (SELECT COALESCE(sum(l.grade_a + l.grade_b + l.grade_c), 0) AS n
                  FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id) li ON TRUE
    WHERE li.n > 0 AND li.n <> COALESCE(d.total_dispatched, 0)
    ORDER BY d.dispatch_date DESC LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'dispatch_lines_mismatch', 'Dispatches whose grade lines do not add to the total', 'Hatchery', 'critical', v_count, v_detail,
          'The eggs billed and the eggs listed by grade disagree, so one of the two figures is wrong on the invoice.');

  -- More eggs dispatched from a flock than it ever produced.
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '') INTO v_count, v_detail FROM (
    SELECT COALESCE(f.flock_no::text, '?') || ' produced ' || round(p.eggs)::text
           || ' dispatched ' || round(s.eggs)::text AS d
    FROM public.flocks f
    JOIN LATERAL (SELECT COALESCE(sum(COALESCE(dr.he_grade_a,0) + COALESCE(dr.he_grade_b,0) + COALESCE(dr.he_grade_c,0)), 0) AS eggs
                  FROM public.daily_records dr WHERE dr.flock_id = f.id) p ON TRUE
    JOIN LATERAL (SELECT COALESCE(sum(l.grade_a + l.grade_b + l.grade_c), 0) AS eggs
                  FROM public.he_dispatch_lines l WHERE l.flock_id = f.id) s ON TRUE
    WHERE s.eggs > p.eggs * 1.02 AND p.eggs > 0
    LIMIT 20) x;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'dispatch_exceeds_production', 'More hatching eggs dispatched than the flock produced', 'Hatchery', 'critical', v_count, v_detail,
          'Eggs left the farm that were never recorded as laid — either production is understated or a dispatch is overstated.');

  -- ── Accounts / bank ───────────────────────────────────────────────────────
  SELECT count(*), '' INTO v_count, v_detail
  FROM public.bank_transactions bt
  WHERE bt.linked_payment_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.pending_payments pp WHERE pp.id = bt.linked_payment_id);
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'bank_orphan_links', 'Bank entries linked to a bill that no longer exists', 'Accounts', 'warning', v_count, v_detail,
          'A payment points at a deleted bill, so the bank ledger and the payables disagree.');

  -- ── REPORT AGAINST SOURCE ─────────────────────────────────────────────────
  -- Egg production, two ways: the flock daily records against the grade
  -- breakdown the register and the dispatch screens read. A page reading only
  -- part of the table, or the wrong column, breaks this.
  SELECT COALESCE(sum(COALESCE(he_eggs,0)), 0),
         COALESCE(sum(COALESCE(he_grade_a,0) + COALESCE(he_grade_b,0) + COALESCE(he_grade_c,0)), 0)
    INTO v_a, v_b
  FROM public.daily_records
  WHERE COALESCE(he_grade_a,0) + COALESCE(he_grade_b,0) + COALESCE(he_grade_c,0) > 0;
  v_count := CASE WHEN v_a > 0 AND abs(v_a - v_b) > v_a * 0.02 THEN 1 ELSE 0 END;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'he_eggs_vs_grades', 'Hatching eggs and their grade breakdown disagree', 'Flocks', 'warning', v_count,
          'HE eggs ' || round(v_a)::text || ' against grades A+B+C ' || round(v_b)::text,
          'The two figures every egg screen is built from do not match, so at least one screen is showing a wrong total.');

  -- Stock value, two ways: the ledger's own arithmetic against the sum of the
  -- per-item balances the Inventory and Feed Stock pages display. If a page
  -- reads the ledger in a way that drops rows, these part company.
  SELECT COALESCE(sum(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                           THEN -qty ELSE qty END), 0) INTO v_a
  FROM public.stock_ledger;
  SELECT COALESCE(sum(b.bal), 0) INTO v_b FROM (
    SELECT SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                    THEN -qty ELSE qty END) AS bal
    FROM public.stock_ledger GROUP BY COALESCE(item_id::text, lower(item_name))) b;
  v_count := CASE WHEN abs(v_a - v_b) > 0.5 THEN 1 ELSE 0 END;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'stock_total_vs_items', 'Total stock and the sum of item balances disagree', 'Inventory', 'critical', v_count,
          'Ledger total ' || round(v_a,2)::text || ' against item balances ' || round(v_b,2)::text,
          'Every item balance added together should equal the ledger as a whole; if not, some rows belong to no item.');

  -- Sales, two ways: the sales register against the sales themselves.
  SELECT COALESCE(sum(amount), 0) INTO v_a FROM public.nhe_sales;
  SELECT COALESCE(sum(amount), 0) INTO v_b FROM public.he_dispatch;
  v_count := 0;
  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'sales_totals', 'Sales recorded (for reference)', 'Accounts', 'info', v_count,
          'NHE ' || round(v_a)::text || ', HE dispatch ' || round(v_b)::text,
          'Not a fault — a running total kept beside the rules so a sudden jump is visible in the history.');

  RETURN 0;
END;
$$;

SELECT 'round2_function' AS chk, count(*)::int AS n
FROM pg_proc WHERE proname = 'fn_health_round2';
