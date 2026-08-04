-- Diagnostic only (no schema changes) — follow-up to 557, where the four
-- dispatch/opening/conversion queries all returned ZERO rows while
-- production returned 16. Since run_sql.py silently treats a "column does
-- not exist" error as success, a wrong column name would look identical to
-- genuinely-no-data. Verifying the actual columns first, then re-counting
-- with NO date filter so nothing is missed by too narrow a window.

-- 1. Real column names on the dispatch tables
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('he_dispatch','he_dispatch_lines')
ORDER BY table_name, ordinal_position;

-- 2. Total dispatch rows for Flock 20 across ALL time (header level)
SELECT 'hdr_all_time' AS src, COUNT(*) AS rows, MIN(dispatch_date) AS first_date,
  MAX(dispatch_date) AS last_date, SUM(total_dispatched) AS total_dispatched
FROM public.he_dispatch
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20');

-- 3. Total dispatch LINE rows for Flock 20 across ALL time
SELECT 'line_all_time' AS src, COUNT(*) AS rows,
  SUM(grade_a) AS grade_a, SUM(grade_b) AS grade_b, SUM(grade_c) AS grade_c
FROM public.he_dispatch_lines
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20');

-- 4. Lifetime production by grade for Flock 20 (what the register adds)
SELECT 'prod_all_time' AS src, COUNT(*) AS rows,
  MIN(record_date) AS first_date, MAX(record_date) AS last_date,
  SUM(he_grade_a) AS grade_a, SUM(he_grade_b) AS grade_b, SUM(he_grade_c) AS grade_c,
  SUM(he_eggs) AS he_eggs
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20');

-- 5. Dispatch headers for Flock 20 on/around the reported date, no join
SELECT 'hdr_july' AS src, id, dispatch_date, prod_date, dc_no, total_dispatched, free_eggs, flock_id
FROM public.he_dispatch
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')
  AND dispatch_date BETWEEN '2026-07-01' AND '2026-07-31'
ORDER BY dispatch_date;

SELECT 'sentinel' AS marker, 1 AS n;
