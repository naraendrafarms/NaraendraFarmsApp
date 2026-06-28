-- Migration 221: no adjustment rows reached stock_ledger (adj_rows=0). Re-sync every
-- feed_stock_adjustments row into stock_ledger (with item_id resolved from items master),
-- so opening stock shows in the balance under the correct master item.

SELECT 'adj_count' AS chk, COUNT(*) AS rows, COALESCE(SUM(adjustment_kg),0) AS total_kg
FROM public.feed_stock_adjustments;

SELECT 'adj_sample' AS chk, adjustment_date, ingredient_name, adjustment_kg, adjustment_type, rate
FROM public.feed_stock_adjustments ORDER BY created_at DESC NULLS LAST LIMIT 8;

INSERT INTO public.stock_ledger
  (txn_date, txn_type, item_id, item_name, qty, unit, unit_price, remarks, adj_id)
SELECT
  COALESCE(a.adjustment_date, CURRENT_DATE),
  CASE WHEN a.adjustment_type ILIKE '%opening%' THEN 'opening'
       WHEN COALESCE(a.adjustment_kg,0) >= 0 THEN 'adjustment_in'
       ELSE 'adjustment_out' END,
  (SELECT i.id FROM public.items i WHERE lower(i.name) = lower(a.ingredient_name) LIMIT 1),
  COALESCE(a.ingredient_name,''),
  ABS(COALESCE(a.adjustment_kg,0)),
  a.unit, a.rate, a.remarks, a.id
FROM public.feed_stock_adjustments a
WHERE NOT EXISTS (SELECT 1 FROM public.stock_ledger sl WHERE sl.adj_id = a.id);

SELECT 'after' AS chk,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE adj_id IS NOT NULL) AS adj_ledger_rows,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE adj_id IS NOT NULL AND item_id IS NULL) AS no_item_match;
