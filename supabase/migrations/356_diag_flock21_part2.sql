-- Migration 356: re-query the 3 statements that produced no output in migration 355
-- (farms/bodjanampet, he_dispatch, nhe_sales) as standalone statements.

SELECT id, name, code, type, is_active FROM public.farms WHERE name ILIKE '%bodjanampet%';

SELECT COUNT(*) AS he_dispatch_rows, MIN(dispatch_date) AS first_date, MAX(dispatch_date) AS last_date, SUM(amount) AS total_amount
FROM public.he_dispatch
WHERE flock_id = '479fe99b-e28a-41bd-8bcb-0a0b437b0ac9';

SELECT sale_type, COUNT(*) AS rows, SUM(amount) AS total_amount
FROM public.nhe_sales
WHERE flock_id = '479fe99b-e28a-41bd-8bcb-0a0b437b0ac9'
GROUP BY sale_type;
