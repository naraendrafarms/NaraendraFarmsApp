-- Medicine consumption reconciles to 0 mismatches app-wide (319) — so
-- Famitone's Used=0 must be a one-off issue with this specific row, not a
-- systemic bug. Check it directly. Also list the 31 mismatched feed items
-- (paginated since run_sql.py's preview only shows 5 array items).
SELECT mu.id, mu.item_id, mu.quantity, mu.usage_date, i.name AS item_name, i.id AS master_item_id
FROM public.medicine_usage mu
LEFT JOIN public.items i ON i.id = mu.item_id
WHERE i.name ILIKE '%famitone%' OR mu.usage_date = '2026-05-06'
ORDER BY mu.usage_date DESC
LIMIT 10;

SELECT COUNT(*) FROM public.stock_ledger WHERE txn_type = 'medicine_out' AND item_name ILIKE '%famitone%';

SELECT * FROM (
  SELECT i.name, i.category,
         COALESCE(fp.total_used, 0) AS feed_usage_total,
         COALESCE(sl.total_out, 0) AS stock_ledger_out_total,
         COALESCE(fp.total_used,0) - COALESCE(sl.total_out,0) AS mismatch
  FROM public.items i
  LEFT JOIN (
    SELECT item_id, SUM(quantity_kg) AS total_used FROM public.feed_production_ingredients GROUP BY item_id
  ) fp ON fp.item_id = i.id
  LEFT JOIN (
    SELECT item_id, SUM(qty) AS total_out FROM public.stock_ledger WHERE txn_type='production_out' GROUP BY item_id
  ) sl ON sl.item_id = i.id
  WHERE i.category = 'Feed Ingredient'
    AND COALESCE(fp.total_used,0) <> COALESCE(sl.total_out,0)
  ORDER BY ABS(COALESCE(fp.total_used,0) - COALESCE(sl.total_out,0)) DESC
) x LIMIT 5 OFFSET 0;
