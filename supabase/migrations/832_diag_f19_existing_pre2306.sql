SELECT 'existing_pre_2306' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19' AND d.record_date < '2025-06-23';
