-- Last date with nonzero closing, first date closing hit 0 after that, and any nonzero after
SELECT
  (SELECT max(record_date)::text FROM public.daily_records WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47' AND closing_female > 0 AND record_date < '2026-08-01') AS last_nonzero_before_aug,
  (SELECT min(record_date)::text FROM public.daily_records WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47' AND closing_female = 0) AS first_zero_date,
  (SELECT max(transfer_female)::text FROM public.daily_records WHERE flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id='678fa4de-c9e1-4e8a-965c-40d21b5eaf47') AS max_transfer_out_ever;

-- Rows around the Aug 2026 zero->nonzero jump
SELECT record_date::text, opening_female, closing_female, transfer_female, remarks
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47'
  AND record_date BETWEEN '2026-08-20' AND '2026-08-25'
ORDER BY record_date;

