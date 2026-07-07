SELECT 'sentinel' AS marker, 1 AS n;

SELECT tgname, tgrelid::regclass AS table_name, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.salary_monthly'::regclass AND NOT tgisinternal;

-- Total audit_log rows ever recorded for salary_monthly (any time range)
SELECT count(*) AS total_salary_monthly_audit_rows FROM audit_log WHERE table_name='salary_monthly';

-- Total rows in salary_monthly for June+July 2026 vs total audit rows in that same window
SELECT count(*) AS sm_rows_jun_jul FROM salary_monthly WHERE month IN ('2026-06-01','2026-07-01');
