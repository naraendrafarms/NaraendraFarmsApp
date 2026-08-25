SELECT f.flock_no, count(*)::int AS n_rows,
  round(sum(COALESCE(d.feed_female_kg,0)+COALESCE(d.feed_male_kg,0))::numeric,1) AS total_kg,
  min(d.record_date)::text AS first_date, max(d.record_date)::text AS last_date
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE d.feed_type_f = 'L2' AND d.record_date BETWEEN '2026-04-01' AND '2026-05-31'
GROUP BY f.flock_no;

SELECT count(*)::int AS n_zero_or_all_flocks FROM public.daily_records
WHERE feed_type_f = 'L2' AND record_date BETWEEN '2026-04-01' AND '2026-05-31';
