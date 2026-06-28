-- Migration 191: Diagnose why Feed Mill raw stock = 0 (read-only)

-- A. stock_ledger overview by type
SELECT 'A_ledger' AS chk, txn_type, COUNT(*) AS rows,
       COUNT(item_id) AS with_id,
       COUNT(NULLIF(TRIM(COALESCE(item_name,'')),'')) AS with_name,
       ROUND(SUM(qty)) AS total_qty
FROM public.stock_ledger GROUP BY txn_type ORDER BY txn_type;

-- B. feed GRN rows in the grn table
SELECT 'B_grn_feed' AS chk, COUNT(*) AS total,
       COUNT(item_id) AS with_item_id,
       COUNT(ingredient_id) AS with_ingredient_id,
       COUNT(NULLIF(TRIM(COALESCE(item_name,'')),'')) AS with_name,
       ROUND(SUM(qty)) AS total_qty
FROM public.grn WHERE category = 'Feed';

-- C. how many stock_ledger rows' item_name matches a Feed Ingredient item?
SELECT 'C_name_match' AS chk, COUNT(*) AS ledger_rows_matching_feed_item
FROM public.stock_ledger sl
WHERE EXISTS (SELECT 1 FROM public.items i
  WHERE i.category='Feed Ingredient' AND LOWER(TRIM(i.name)) = LOWER(TRIM(sl.item_name)));

-- D. per-item: do ledger rows exist by id or by name? (sample)
SELECT 'D_item_sample' AS chk, i.name,
  (SELECT COUNT(*) FROM public.stock_ledger sl WHERE sl.item_id = i.id) AS ledger_by_id,
  (SELECT COUNT(*) FROM public.stock_ledger sl WHERE LOWER(TRIM(sl.item_name)) = LOWER(TRIM(i.name))) AS ledger_by_name
FROM public.items i WHERE i.category='Feed Ingredient' ORDER BY i.name LIMIT 8;

-- E. sample feed GRN rows (how is feed GRN actually stored?)
SELECT 'E_grn_sample' AS chk, grn_no, item_id, ingredient_id, item_name, qty
FROM public.grn WHERE category='Feed' ORDER BY grn_date DESC LIMIT 5;
