-- How many existing Feed Ingredient GRN rows have an item_id that isn't
-- backed by a feed_ingredients row (i.e. genuinely new items added after
-- the unified items table migration) — these would be the ones that were
-- silently failing to save until the ingredient_id fix.
SELECT COUNT(*) AS grn_new_items_affected
FROM public.grn
WHERE category = 'Feed Ingredient'
  AND item_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.feed_ingredients fi WHERE fi.id = grn.item_id);

-- Which items master rows (category = Feed Ingredient) have no matching
-- feed_ingredients row — these are the "new since unification" items
SELECT COUNT(*) AS items_not_in_feed_ingredients
FROM public.items i
WHERE i.category = 'Feed Ingredient'
  AND NOT EXISTS (SELECT 1 FROM public.feed_ingredients fi WHERE fi.id = i.id);
