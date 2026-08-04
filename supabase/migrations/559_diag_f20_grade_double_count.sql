-- Diagnostic only (no schema changes) — Daily Stock Register shows DOUBLE
-- the production that Bulk Daily Entry shows for Flock 20.
-- daily_records holds TWO kinds of rows per day: one per shed
-- (shed_id IS NOT NULL) and one flock-level row (shed_id IS NULL) that
-- carries the Grade A/B/C breakdown. The stock register sums
-- he_grade_a/b/c across ALL rows for a date with no shed_id filter — if the
-- grades are populated on BOTH kinds of row, every day is counted twice.
-- Splitting the same dates by row kind to confirm.
SELECT record_date,
  COUNT(*) FILTER (WHERE shed_id IS NOT NULL) AS shed_rows,
  COUNT(*) FILTER (WHERE shed_id IS NULL)     AS flock_rows,
  SUM(he_grade_a) FILTER (WHERE shed_id IS NOT NULL) AS shed_grade_a,
  SUM(he_grade_a) FILTER (WHERE shed_id IS NULL)     AS flock_grade_a,
  SUM(he_grade_b) FILTER (WHERE shed_id IS NOT NULL) AS shed_grade_b,
  SUM(he_grade_b) FILTER (WHERE shed_id IS NULL)     AS flock_grade_b,
  SUM(he_grade_c) FILTER (WHERE shed_id IS NOT NULL) AS shed_grade_c,
  SUM(he_grade_c) FILTER (WHERE shed_id IS NULL)     AS flock_grade_c,
  SUM(he_eggs)    FILTER (WHERE shed_id IS NOT NULL) AS shed_he_eggs,
  SUM(he_eggs)    FILTER (WHERE shed_id IS NULL)     AS flock_he_eggs
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')
  AND record_date BETWEEN '2026-07-12' AND '2026-07-16'
GROUP BY record_date ORDER BY record_date;

-- Lifetime split, to size the impact across the whole flock
SELECT 'lifetime' AS src,
  SUM(he_grade_a) FILTER (WHERE shed_id IS NOT NULL) AS shed_grade_a,
  SUM(he_grade_a) FILTER (WHERE shed_id IS NULL)     AS flock_grade_a,
  SUM(he_grade_b) FILTER (WHERE shed_id IS NOT NULL) AS shed_grade_b,
  SUM(he_grade_b) FILTER (WHERE shed_id IS NULL)     AS flock_grade_b,
  SUM(he_grade_c) FILTER (WHERE shed_id IS NOT NULL) AS shed_grade_c,
  SUM(he_grade_c) FILTER (WHERE shed_id IS NULL)     AS flock_grade_c,
  SUM(he_eggs)    FILTER (WHERE shed_id IS NOT NULL) AS shed_he_eggs,
  SUM(he_eggs)    FILTER (WHERE shed_id IS NULL)     AS flock_he_eggs
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20');

SELECT 'sentinel' AS marker, 1 AS n;
