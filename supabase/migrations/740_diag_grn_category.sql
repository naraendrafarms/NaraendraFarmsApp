-- Migration 740: read-only. 739 showed grn has qty and category but NO
-- quantity column, so the statements naming quantity failed silently. Ask the
-- questions that matter: what category the Alkakarb GRN carries (Feed Stock
-- Status filters on category = 'Feed Ingredient'), and how 40 Degree reaches
-- its balance.

SELECT 'alkakarb_grn' AS chk, grn_date::text AS grn_date, grn_no, item_name,
       qty, unit, COALESCE(category, '(null)') AS category,
       (item_id IS NULL) AS unlinked
FROM public.grn WHERE item_name ILIKE '%alka%';

SELECT 'grn_categories' AS chk, COALESCE(category, '(null)') AS category, count(*)::int AS rows
FROM public.grn GROUP BY category ORDER BY count(*) DESC;

SELECT 'grn_11jun_categories' AS chk, item_name, qty, COALESCE(category, '(null)') AS category
FROM public.grn WHERE grn_date = DATE '2026-06-11' ORDER BY item_name;

SELECT 'forty_degree' AS chk, txn_type, count(*)::int AS rows, round(sum(qty)::numeric, 2) AS total
FROM public.stock_ledger WHERE item_name ILIKE '%40 degree%'
GROUP BY txn_type ORDER BY txn_type;

SELECT 'forty_degree_may31' AS chk, count(*)::int AS rows_on_31may,
       round(COALESCE(sum(qty), 0)::numeric, 2) AS qty_on_31may
FROM public.stock_ledger
WHERE item_name ILIKE '%40 degree%' AND txn_date = DATE '2026-05-31';
