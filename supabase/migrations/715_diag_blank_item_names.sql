-- Migration 715: read-only. The ledger item picker showed a BLANK first entry,
-- and 160 distinct names map to 155 items — find the rows whose item_name is
-- empty, and what else is on them, before deciding anything about them.

SELECT 'blank_name_rows' AS chk, count(*)::int AS n,
       count(*) FILTER (WHERE item_id IS NULL)::int AS also_unlinked
FROM public.stock_ledger
WHERE COALESCE(btrim(item_name), '') = '';

SELECT 'blank_name_detail' AS chk, txn_type, count(*)::int AS n,
       min(txn_date) AS first_date, max(txn_date) AS last_date,
       round(sum(qty)::numeric, 2) AS total_qty
FROM public.stock_ledger
WHERE COALESCE(btrim(item_name), '') = ''
GROUP BY txn_type ORDER BY txn_type;

SELECT 'blank_name_sources' AS chk,
       count(*) FILTER (WHERE grn_id IS NOT NULL)::int AS from_grn,
       count(*) FILTER (WHERE feed_prod_id IS NOT NULL)::int AS from_production,
       count(*) FILTER (WHERE med_usage_id IS NOT NULL)::int AS from_medicine,
       count(*) FILTER (WHERE adj_id IS NOT NULL)::int AS from_adjustment
FROM public.stock_ledger
WHERE COALESCE(btrim(item_name), '') = '';
