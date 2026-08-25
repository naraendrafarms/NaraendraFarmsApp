SELECT count(*)::int AS n FROM public.flock_weekly_performance fwp
JOIN public.flocks fl ON fl.id = fwp.flock_id
WHERE fl.flock_no::text = '20';

SELECT string_agg(week_of_age || sex || ':' || avg_body_weight_g, ',' ORDER BY week_of_age, sex) AS rows
FROM public.flock_weekly_performance fwp
JOIN public.flocks fl ON fl.id = fwp.flock_id
WHERE fl.flock_no::text = '20' AND week_of_age BETWEEN 1 AND 5;

SELECT string_agg(week_of_age || sex || ':' || avg_body_weight_g, ',' ORDER BY week_of_age, sex) AS rows
FROM public.flock_weekly_performance fwp
JOIN public.flocks fl ON fl.id = fwp.flock_id
WHERE fl.flock_no::text = '20' AND week_of_age BETWEEN 58 AND 61;
