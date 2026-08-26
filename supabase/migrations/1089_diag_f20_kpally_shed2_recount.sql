SELECT count(*)::int AS n, min(record_date)::text AS mind, max(record_date)::text AS maxd,
  max(opening_female)::text AS max_open_f
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47';
