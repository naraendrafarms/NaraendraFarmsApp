-- Migration 137: Remove restrictive CHECK on feed_ingredients.category
-- The app lets admins define custom ingredient categories via config_options.
-- The old CHECK constraint (grain/protein/mineral/supplement/additive/other) blocks
-- saving any custom category added in Admin Centre → Ingredient Categories.

ALTER TABLE public.feed_ingredients
  DROP CONSTRAINT IF EXISTS feed_ingredients_category_check;

-- Verify constraint is gone
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name   = 'feed_ingredients'
  AND constraint_type = 'CHECK';
