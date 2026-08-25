SELECT ft.code, ff.is_active,
  round(sum(CASE WHEN fi.ingredient_name = 'Maize' THEN fi.percentage ELSE 0 END),2) AS maize_pct,
  round(sum(CASE WHEN fi.ingredient_name ILIKE 'Soya%' THEN fi.percentage ELSE 0 END),2) AS soya_pct,
  count(fi.id)::int AS n_ingredients
FROM public.feed_types ft
JOIN public.feed_formulas ff ON ff.feed_type_id = ft.id
LEFT JOIN public.feed_formula_ingredients fi ON fi.formula_id = ff.id
WHERE ft.code IN ('L2','L3') AND ff.is_active
GROUP BY ft.code, ff.id, ff.is_active
ORDER BY ft.code;
