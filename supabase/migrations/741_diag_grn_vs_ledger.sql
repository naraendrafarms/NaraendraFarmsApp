-- Migration 741: read-only. "Alkakarb is not showing, check if others are the
-- same." The honest test is whether every GRN line reached the stock ledger,
-- and whether any receipt is stranded because its item is missing from Items
-- Master or marked inactive — Feed Stock Status lists items, not ledger rows,
-- so an unlisted item's stock is invisible however correct the ledger is.

SELECT 'grn_coverage' AS chk, count(*)::int AS grn_lines,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.stock_ledger s WHERE s.grn_id = g.id))::int AS reached_ledger,
       count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.stock_ledger s WHERE s.grn_id = g.id))::int AS missing
FROM public.grn g;

SELECT 'missing_detail' AS chk,
       COALESCE(string_agg(g.grn_date::text || ' ' || COALESCE(g.item_name,'?') || ' ' || COALESCE(g.qty,0)::text, ' | '), '(none)') AS lines_not_in_ledger
FROM public.grn g
WHERE NOT EXISTS (SELECT 1 FROM public.stock_ledger s WHERE s.grn_id = g.id);

-- Feed ingredients whose stock exists in the ledger but which the Feed Stock
-- Status list cannot show: no Items Master row, or inactive.
SELECT 'unlistable' AS chk, count(*)::int AS names
FROM (
  SELECT DISTINCT sl.item_name FROM public.stock_ledger sl
  WHERE NOT EXISTS (SELECT 1 FROM public.items i
                    WHERE lower(i.name) = lower(sl.item_name) AND i.is_active AND i.category = 'Feed Ingredient')
    AND sl.txn_type = 'production_out'
) x;

SELECT 'inactive_items' AS chk,
       COALESCE(string_agg(i.name, ', ' ORDER BY i.name), '(none)') AS inactive_feed_items
FROM public.items i WHERE i.category = 'Feed Ingredient' AND NOT i.is_active;

SELECT 'alkakarb_from_page_view' AS chk,
       (SELECT count(*)::int FROM public.items
        WHERE lower(name) = 'alkakarb' AND is_active AND category = 'Feed Ingredient') AS listed_on_page,
       (SELECT round(SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                              THEN -qty ELSE qty END)::numeric, 2)
        FROM public.stock_ledger WHERE item_name ILIKE '%alka%') AS ledger_balance;
