SELECT f.flock_no, count(*)::int AS n_rows,
  min(d.record_date)::text AS first_date, max(d.record_date)::text AS last_date
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47'
GROUP BY f.flock_no
ORDER BY f.flock_no;

SELECT string_agg(tgname || ':' || CASE WHEN tgenabled='D' THEN 'disabled' ELSE 'ENABLED' END, ' | ') AS trigger_state
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass
  AND tgname IN ('trg_chain_daily_opening','trg_chain_cascade');
