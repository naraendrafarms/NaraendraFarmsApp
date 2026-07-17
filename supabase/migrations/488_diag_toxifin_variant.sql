-- Checking for a possible third spelling variant "Toxifin" (with an i) —
-- is it a distinct Items Master entry, and does it have any consumption
-- (stock_ledger/feed_production_ingredients) recorded under it?
SELECT id, name, is_active, category, manufacturer FROM public.items WHERE name ILIKE '%tox%fin%';

SELECT id, alias, item_id FROM public.item_aliases WHERE alias ILIKE '%tox%fin%';

SELECT item_id, item_name, txn_type, count(*), sum(qty::numeric) AS total_qty
FROM public.stock_ledger WHERE item_name ILIKE '%tox%fin%'
GROUP BY item_id, item_name, txn_type ORDER BY item_name;

SELECT item_id, ingredient_name, count(*), sum(quantity_kg::numeric) AS total_qty
FROM public.feed_production_ingredients WHERE ingredient_name ILIKE '%tox%fin%'
GROUP BY item_id, ingredient_name ORDER BY ingredient_name;
