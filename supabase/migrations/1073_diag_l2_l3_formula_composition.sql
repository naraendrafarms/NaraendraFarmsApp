SELECT ft.code, ff.id::text AS formula_id, ff.is_active, ff.created_at::text,
  string_agg(fi.ingredient_name || '=' || fi.percentage::text || '%', ', ' ORDER BY fi.percentage DESC) AS composition
FROM public.feed_types ft
JOIN public.feed_formulas ff ON ff.feed_type_id = ft.id
LEFT JOIN public.feed_formula_ingredients fi ON fi.formula_id = ff.id
WHERE ft.code IN ('L2','L3')
GROUP BY ft.code, ff.id, ff.is_active, ff.created_at
ORDER BY ft.code, ff.created_at;
