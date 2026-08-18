-- Migration 742: read-only. Feed Stock Status shows Alkakarb received 2,175
-- (the opening only) and balance -879, with last GRN 01/04/2026 — the 5,000 kg
-- of 11/06 is not being counted. That page prefers ID-linked totals and only
-- falls back to name-linked ones when an item has NO id-linked rows at all, so
-- a single unlinked row among linked ones would be dropped. Check the link on
-- each Alkakarb ledger row.

SELECT 'alka_rows_by_link' AS chk, txn_type,
       (item_id IS NULL) AS unlinked, count(*)::int AS rows,
       round(sum(qty)::numeric, 2) AS total_qty
FROM public.stock_ledger WHERE item_name ILIKE '%alka%'
GROUP BY txn_type, (item_id IS NULL) ORDER BY txn_type, 3;

-- How widespread: items that have BOTH linked and unlinked ledger rows are
-- exactly the ones that page can misreport.
SELECT 'items_mixed_links' AS chk, count(*)::int AS item_names
FROM (
  SELECT lower(item_name) AS nm FROM public.stock_ledger
  GROUP BY lower(item_name)
  HAVING count(*) FILTER (WHERE item_id IS NULL) > 0
     AND count(*) FILTER (WHERE item_id IS NOT NULL) > 0
) x;

SELECT 'mixed_list' AS chk,
       COALESCE(string_agg(x.nm, ', ' ORDER BY x.nm), '(none)') AS names
FROM (
  SELECT lower(item_name) AS nm FROM public.stock_ledger
  GROUP BY lower(item_name)
  HAVING count(*) FILTER (WHERE item_id IS NULL) > 0
     AND count(*) FILTER (WHERE item_id IS NOT NULL) > 0
) x;

-- Unlinked rows overall, and how many came from a GRN.
SELECT 'unlinked_rows' AS chk, count(*)::int AS unlinked_total,
       count(*) FILTER (WHERE grn_id IS NOT NULL)::int AS from_grn,
       round(sum(qty)::numeric, 2) AS qty
FROM public.stock_ledger WHERE item_id IS NULL;
