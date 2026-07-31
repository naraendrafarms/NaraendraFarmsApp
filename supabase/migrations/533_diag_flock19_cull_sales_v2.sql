-- Diagnostic only (no schema changes) — retry of 531 with the correct
-- flock_no type (text, not integer — confirmed via 532).
SELECT record_date, shed_id, cull_female, cull_male, mortality_female, mortality_male
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date >= '2026-01-18' AND record_date <= '2026-06-23'
  AND (COALESCE(cull_female,0) > 0 OR COALESCE(cull_male,0) > 0)
ORDER BY record_date;

SELECT count(*) AS total_daily_rows_in_range,
  count(*) FILTER (WHERE COALESCE(cull_female,0) > 0 OR COALESCE(cull_male,0) > 0) AS rows_with_cull,
  min(record_date) AS earliest, max(record_date) AS latest
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date >= '2026-01-18' AND record_date <= '2026-06-23';

SELECT sale_date, sale_type, quantity, amount, payment_status
FROM public.nhe_sales
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND sale_type = 'bird_sale'
  AND sale_date >= '2026-01-18' AND sale_date <= '2026-06-23'
ORDER BY sale_date;

SELECT count(*) AS total_bird_sale_rows
FROM public.nhe_sales
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND sale_type = 'bird_sale';

SELECT 'sentinel' AS marker, 1 AS n;
