-- Migration 714: read-only. Inventory > Stock Ledger: picking an item after
-- typing in the search box shows no movements, while picking it straight from
-- the list does. The dropdown is built from stock_ledger itself, keyed on
-- item_id when there is one and on item_name when there is not, so look for
-- the shapes of data that would make one item appear as two entries.

SELECT 'rows' AS chk, count(*)::int AS n_rows,
       count(*) FILTER (WHERE item_id IS NULL)::int AS no_item_id,
       count(DISTINCT item_id)::int AS distinct_ids,
       count(DISTINCT item_name)::int AS distinct_names
FROM public.stock_ledger;

SELECT 'name_both_ways' AS chk, count(*)::int AS n
FROM (SELECT item_name FROM public.stock_ledger
      GROUP BY item_name
      HAVING count(*) FILTER (WHERE item_id IS NULL) > 0
         AND count(*) FILTER (WHERE item_id IS NOT NULL) > 0) x;

SELECT 'name_both_ways_list' AS chk, string_agg(item_name, ' | ') AS names
FROM (SELECT item_name FROM public.stock_ledger
      GROUP BY item_name
      HAVING count(*) FILTER (WHERE item_id IS NULL) > 0
         AND count(*) FILTER (WHERE item_id IS NOT NULL) > 0
      ORDER BY item_name LIMIT 25) y;

SELECT 'padded_names' AS chk, count(*)::int AS n
FROM public.stock_ledger WHERE item_name <> btrim(item_name);

SELECT 'one_id_many_names' AS chk, count(*)::int AS n
FROM (SELECT item_id FROM public.stock_ledger WHERE item_id IS NOT NULL
      GROUP BY item_id HAVING count(DISTINCT item_name) > 1) z;

SELECT 'aliases' AS chk, count(*)::int AS n FROM public.item_aliases;
