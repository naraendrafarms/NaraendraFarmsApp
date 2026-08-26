SELECT count(*)::int AS n_rows, min(record_date)::text AS first_date, max(record_date)::text AS last_date
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47';

SELECT id::text, flock_id::text, to_shed_id::text, transfer_date::text, female_count, male_count
FROM public.flock_transfers
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND to_shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47';

SELECT flock_id::text, shed_id::text, created_at::text
FROM public.flock_sheds
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47';

SELECT id::text, flock_id::text, shed_id::text, allocated_date::text, female_count, male_count
FROM public.shed_allocations
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47';
