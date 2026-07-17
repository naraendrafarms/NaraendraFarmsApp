-- Diagnostic only, no writes. Confirms the theory behind Toxfin 360 Dry
-- showing 2 rows in Inventory despite 1 row in Items Master: some
-- stock_ledger (and possibly grn / feed_production_ingredients) rows for
-- it have item_id = NULL, so Inventory's item_id-else-name fallback key
-- forks a second row keyed by name instead of folding into the real item.
SELECT id, name, is_active, category, manufacturer FROM public.items WHERE name ILIKE '%toxfin%';

SELECT id, alias, item_id FROM public.item_aliases WHERE alias ILIKE '%toxfin%';

SELECT id, item_id, item_name, txn_type, qty, txn_date
FROM public.stock_ledger WHERE item_name ILIKE '%toxfin%' ORDER BY item_id NULLS FIRST;

SELECT id, item_id, item_name FROM public.grn WHERE item_name ILIKE '%toxfin%' AND item_id IS NULL;

SELECT id, item_id, ingredient_name FROM public.feed_production_ingredients WHERE ingredient_name ILIKE '%toxfin%' AND item_id IS NULL;
