-- User is right to be annoyed — Famitone shows Used=0 in Inventory despite
-- a real medicine_usage entry (5 Ltr, Flock 22, 06/05/2026). Rather than
-- spot-checking one product at a time, reconcile ALL consumption sources
-- against stock_ledger in one pass: medicine_usage, feed_production
-- ingredients, and he_dispatch, to find every item where the source table
-- has usage but stock_ledger's matching *_out total doesn't match (or is
-- missing entirely).

-- 1. Medicine: total usage per item vs stock_ledger medicine_out per item
SELECT i.name, i.category,
       COALESCE(mu.total_used, 0) AS medicine_usage_total,
       COALESCE(sl.total_out, 0) AS stock_ledger_out_total,
       COALESCE(mu.total_used, 0) - COALESCE(sl.total_out, 0) AS mismatch
FROM public.items i
LEFT JOIN (
  SELECT item_id, SUM(quantity) AS total_used FROM public.medicine_usage GROUP BY item_id
) mu ON mu.item_id = i.id
LEFT JOIN (
  SELECT item_id, SUM(qty) AS total_out FROM public.stock_ledger WHERE txn_type='medicine_out' GROUP BY item_id
) sl ON sl.item_id = i.id
WHERE i.category IN ('Medicine','Vaccine','Supplement','Sanitizer','Injectable','Disinfectant','Pesticide')
  AND COALESCE(mu.total_used,0) <> COALESCE(sl.total_out,0)
ORDER BY ABS(COALESCE(mu.total_used,0) - COALESCE(sl.total_out,0)) DESC
LIMIT 5;

-- 2. Count how many medicine items have ANY mismatch at all
SELECT COUNT(*) AS medicine_items_with_mismatch
FROM public.items i
LEFT JOIN (
  SELECT item_id, SUM(quantity) AS total_used FROM public.medicine_usage GROUP BY item_id
) mu ON mu.item_id = i.id
LEFT JOIN (
  SELECT item_id, SUM(qty) AS total_out FROM public.stock_ledger WHERE txn_type='medicine_out' GROUP BY item_id
) sl ON sl.item_id = i.id
WHERE i.category IN ('Medicine','Vaccine','Supplement','Sanitizer','Injectable','Disinfectant','Pesticide')
  AND COALESCE(mu.total_used,0) <> COALESCE(sl.total_out,0);

-- 3. Feed: total production-ingredient consumption vs stock_ledger production_out
SELECT COUNT(*) AS feed_items_with_mismatch
FROM public.items i
LEFT JOIN (
  SELECT item_id, SUM(quantity_kg) AS total_used FROM public.feed_production_ingredients GROUP BY item_id
) fp ON fp.item_id = i.id
LEFT JOIN (
  SELECT item_id, SUM(qty) AS total_out FROM public.stock_ledger WHERE txn_type='production_out' GROUP BY item_id
) sl ON sl.item_id = i.id
WHERE i.category = 'Feed Ingredient'
  AND COALESCE(fp.total_used,0) <> COALESCE(sl.total_out,0);
