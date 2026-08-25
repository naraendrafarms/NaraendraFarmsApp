SELECT string_agg(ft.code || ':' || fpl.production_date::text || '=' || fpl.quantity_kg::text, '; ' ORDER BY fpl.production_date) AS production_log
FROM public.feed_production_log fpl
JOIN public.feed_formulas ff ON ff.id = fpl.formula_id
JOIN public.feed_types ft ON ft.id = ff.feed_type_id
WHERE fpl.production_date BETWEEN '2026-02-01' AND '2026-07-01'
  AND ft.code IN ('L1','L2','L3');

SELECT ft.code, count(*)::int AS n_batches, min(fpl.production_date)::text AS first_date, max(fpl.production_date)::text AS last_date, round(sum(fpl.quantity_kg)::numeric,1) AS total_kg
FROM public.feed_production_log fpl
JOIN public.feed_formulas ff ON ff.id = fpl.formula_id
JOIN public.feed_types ft ON ft.id = ff.feed_type_id
WHERE ft.code IN ('L1','L2','L3')
GROUP BY ft.code
ORDER BY ft.code;
