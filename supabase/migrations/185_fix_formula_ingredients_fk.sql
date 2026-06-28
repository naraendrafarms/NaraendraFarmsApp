-- Migration 185: Fix the foreign key on feed_formula_ingredients.
-- Root cause: feed_formula_ingredients_formula_id_fkey referenced the OLD
-- table feed_formulas_legacy, not the current feed_formulas. So saving a
-- formula's ingredients (formula_id from feed_formulas) always failed the FK.
-- Fix: drop the wrong FK and re-point it to feed_formulas(id).

ALTER TABLE public.feed_formula_ingredients
  DROP CONSTRAINT IF EXISTS feed_formula_ingredients_formula_id_fkey;

ALTER TABLE public.feed_formula_ingredients
  ADD CONSTRAINT feed_formula_ingredients_formula_id_fkey
  FOREIGN KEY (formula_id) REFERENCES public.feed_formulas(id) ON DELETE CASCADE;

-- Verify the FK now points to feed_formulas
SELECT tc.constraint_name, ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'feed_formula_ingredients';
