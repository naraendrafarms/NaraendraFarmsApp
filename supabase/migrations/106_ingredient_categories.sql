-- Add ingredient_category group to config_options
-- These are the nutritional/type categories for feed raw materials
INSERT INTO public.config_options (grp, value, sort_order)
SELECT grp, value, sort_order FROM (VALUES
  ('ingredient_category', 'grain',       1),
  ('ingredient_category', 'protein',     2),
  ('ingredient_category', 'mineral',     3),
  ('ingredient_category', 'supplement',  4),
  ('ingredient_category', 'additive',    5),
  ('ingredient_category', 'other',       6)
) AS v(grp, value, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.config_options WHERE grp = 'ingredient_category'
);
