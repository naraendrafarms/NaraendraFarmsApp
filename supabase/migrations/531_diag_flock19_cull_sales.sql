-- Diagnostic only (no schema changes) — user says Flock 19's cull sales
-- (female and male) data is missing for a period around 18/01 to
-- 23/06/2026. Checking what's actually on file: flock info, daily_records
-- cull columns, and any bird-sale (cull) records in nhe_sales for this
-- flock across that window.
SELECT id, flock_no, placement_date, status FROM public.flocks WHERE flock_no = 19;

SELECT record_date, shed_id, cull_female, cull_male, mortality_female, mortality_male
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = 19)
  AND record_date >= '2026-01-18' AND record_date <= '2026-06-23'
  AND (COALESCE(cull_female,0) > 0 OR COALESCE(cull_male,0) > 0)
ORDER BY record_date;

SELECT count(*) AS total_daily_rows_in_range
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = 19)
  AND record_date >= '2026-01-18' AND record_date <= '2026-06-23';

SELECT sale_date, sale_type, quantity, amount, payment_status
FROM public.nhe_sales
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = 19)
  AND sale_type = 'bird_sale'
  AND sale_date >= '2026-01-18' AND sale_date <= '2026-06-23'
ORDER BY sale_date;

SELECT 'sentinel' AS marker, 1 AS n;
