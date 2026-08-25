SELECT f.flock_no, string_agg(DISTINCT d.feed_type_f, ', ' ORDER BY d.feed_type_f) AS female_codes
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE d.feed_type_f IS NOT NULL
GROUP BY f.flock_no
ORDER BY f.flock_no;

SELECT count(*)::int AS n_l2_female FROM public.daily_records WHERE feed_type_f ILIKE 'L2%' OR feed_type_f ILIKE '%L-2%';
SELECT count(*)::int AS n_l2_male FROM public.daily_records WHERE feed_type_m ILIKE 'L2%' OR feed_type_m ILIKE '%L-2%';
