-- Backfill the missing feed-mill consumption, and stop it happening again.
--
-- 921 ingredient lines across 34 batches never wrote a production_out row:
-- 8,62,210 kg of ingredients consumed by real production that never came off
-- stock. Proven writable by the test in migration 706 -- the same insert
-- succeeded by hand -- so these rows were never rejected; the trigger simply
-- did not run for them.
--
-- Each backfilled row is dated to its OWN production date, not today, so the
-- ledger reads correctly in date order and any month-end figure already taken
-- stays comparable.
--
-- Audit figures are written to a table rather than printed, because this runner
-- silently drops result output; migration 709 reads them back.

CREATE TABLE IF NOT EXISTS public._audit_feedmill_backfill (
  stage text, note text, captured_at timestamptz DEFAULT now()
);
DELETE FROM public._audit_feedmill_backfill;

INSERT INTO public._audit_feedmill_backfill (stage, note)
SELECT 'BEFORE',
       'ingredient_kg=' || ROUND(COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients),0))
       || ' ledger_out_kg=' || ROUND(COALESCE((SELECT SUM(qty) FROM public.stock_ledger WHERE txn_type='production_out'),0))
       || ' ledger_rows=' || (SELECT COUNT(*) FROM public.stock_ledger WHERE txn_type='production_out')
       || ' missing_lines=' || (SELECT COUNT(*) FROM public.feed_production_ingredients i
                                WHERE NOT EXISTS (SELECT 1 FROM public.stock_ledger s
                                  WHERE s.feed_prod_id = i.production_id AND s.txn_type='production_out'
                                    AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,''))));

-- THE BACKFILL.
INSERT INTO public.stock_ledger (txn_date, txn_type, item_id, item_name, qty, unit, feed_prod_id, farm_id, remarks)
SELECT COALESCE(l.production_date, CURRENT_DATE), 'production_out',
       (SELECT it.id FROM public.items it WHERE lower(it.name) = lower(COALESCE(i.ingredient_name,'')) LIMIT 1),
       COALESCE(i.ingredient_name,''), COALESCE(i.quantity_kg,0), 'kg',
       i.production_id, l.farm_id,
       'Backfilled 17/08/2026 — consumption recorded on the production but never posted to stock'
FROM public.feed_production_ingredients i
JOIN public.feed_production_log l ON l.id = i.production_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger s
  WHERE s.feed_prod_id = i.production_id AND s.txn_type='production_out'
    AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,'')));

INSERT INTO public._audit_feedmill_backfill (stage, note)
SELECT 'AFTER',
       'ingredient_kg=' || ROUND(COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients),0))
       || ' ledger_out_kg=' || ROUND(COALESCE((SELECT SUM(qty) FROM public.stock_ledger WHERE txn_type='production_out'),0))
       || ' ledger_rows=' || (SELECT COUNT(*) FROM public.stock_ledger WHERE txn_type='production_out')
       || ' missing_lines=' || (SELECT COUNT(*) FROM public.feed_production_ingredients i
                                WHERE NOT EXISTS (SELECT 1 FROM public.stock_ledger s
                                  WHERE s.feed_prod_id = i.production_id AND s.txn_type='production_out'
                                    AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,''))));

-- Batches still disagreeing after the backfill, if any.
INSERT INTO public._audit_feedmill_backfill (stage, note)
SELECT 'MISMATCHED_BATCHES', COUNT(*)::text
FROM (
  SELECT l.id,
         COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients i WHERE i.production_id=l.id),0) AS ing,
         COALESCE((SELECT SUM(qty) FROM public.stock_ledger s WHERE s.feed_prod_id=l.id AND s.txn_type='production_out'),0) AS led
  FROM public.feed_production_log l
) x WHERE ABS(ing - led) > 1;

-- Ingredient items now showing a negative balance, which would mean the
-- consumption exceeds what was ever purchased or opened.
INSERT INTO public._audit_feedmill_backfill (stage, note)
SELECT 'NEGATIVE_INGREDIENTS', COALESCE(string_agg(item || '=' || ROUND(bal), ', ' ORDER BY bal), 'none')
FROM (
  SELECT COALESCE(sl.item_name,'(no name)') AS item,
         SUM(CASE WHEN sl.txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                  THEN -COALESCE(sl.qty,0) ELSE COALESCE(sl.qty,0) END) AS bal
  FROM public.stock_ledger sl
  JOIN public.items it ON lower(it.name) = lower(sl.item_name) AND it.category = 'Feed Ingredient'
  GROUP BY 1
) y WHERE bal < -0.5;
