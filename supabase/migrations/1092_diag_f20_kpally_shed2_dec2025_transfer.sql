SELECT count(*)::int AS n_rows_2025dec_2026aug,
  (SELECT max(record_date)::text FROM public.daily_records WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47' AND record_date < '2026-01-01') AS last_date_2025,
  (SELECT min(record_date)::text FROM public.daily_records WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47' AND record_date >= '2026-01-01') AS first_date_2026
FROM public.daily_records
WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47'
  AND record_date BETWEEN '2025-12-01' AND '2026-08-25';

SELECT count(*)::int AS n
FROM public.daily_records
WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47'
  AND record_date BETWEEN '2025-12-20' AND '2025-12-31';
