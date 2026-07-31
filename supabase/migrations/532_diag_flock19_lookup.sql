-- Diagnostic only (no schema changes) — the previous diagnostic's
-- "flocks WHERE flock_no = 19" returned ZERO rows (run_sql.py only prints
-- when rows>0, so total silence across all 4 queries means this exact
-- match failed at the very first step). Checking the actual flock_no
-- column type/values to see how "Flock 19" is really stored.
SELECT id, flock_no, pg_typeof(flock_no) AS flock_no_type, placement_date, status
FROM public.flocks
WHERE flock_no::text ILIKE '%19%'
ORDER BY flock_no;

SELECT 'sentinel' AS marker, 1 AS n;
