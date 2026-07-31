-- Diagnostic only (no schema changes) — compact single-row listing of all
-- designation_extra_days designations, to avoid the previous query's log
-- line getting truncated mid-JSON.
SELECT string_agg(designation || ':' || extra_days_ge15 || '/' || extra_days_lt15, ' | ' ORDER BY designation) AS all_rules
FROM public.designation_extra_days;

SELECT 'sentinel' AS marker, 1 AS n;
