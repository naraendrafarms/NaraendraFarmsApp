SELECT f.flock_no, count(*)::int AS n, min(d.record_date)::text AS first_date, max(d.record_date)::text AS last_date
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE d.feed_type_m = 'Male'
GROUP BY f.flock_no;

SELECT count(*)::int AS n_feed_type_f_male_variant
FROM public.daily_records
WHERE feed_type_f = 'Male';
