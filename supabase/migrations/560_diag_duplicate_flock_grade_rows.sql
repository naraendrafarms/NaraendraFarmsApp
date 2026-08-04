-- Diagnostic only (no schema changes) — 559 proved the doubling: on
-- 2026-07-14 Flock 20 has TWO flock-level rows (shed_id IS NULL) instead of
-- one, each carrying the Grade A/B/C breakdown, so the Daily Stock Register
-- (which sums grades across all rows for a date) counts that day twice.
-- Grades live ONLY on flock-level rows (lifetime shed_grade_* was all NULL),
-- so any date with 2+ such rows is doubled.
-- Migration 086's unique index is (flock_id, record_date, farm_id)
-- WHERE shed_id IS NULL — it includes farm_id, so the SAME flock-day can
-- legally hold one flock-level row per farm. Checking whether that's how
-- the duplicates got in, and how widespread this is across all flocks.

-- 1. The two rows on the reported date, side by side
SELECT id, farm_id, shed_id, he_grade_a, he_grade_b, he_grade_c, he_eggs, created_at
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')
  AND record_date = '2026-07-14' AND shed_id IS NULL
ORDER BY created_at;

-- 2. Every flock/date with more than one flock-level row (the full blast radius)
SELECT f.flock_no, d.record_date, COUNT(*) AS flock_level_rows,
  COUNT(DISTINCT d.farm_id) AS distinct_farms,
  SUM(d.he_grade_a) AS grade_a_summed, SUM(d.he_grade_b) AS grade_b_summed, SUM(d.he_grade_c) AS grade_c_summed
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.shed_id IS NULL
GROUP BY f.flock_no, d.record_date
HAVING COUNT(*) > 1
ORDER BY f.flock_no, d.record_date;

-- 3. How many such duplicated days exist in total, per flock
SELECT f.flock_no, COUNT(*) AS duplicated_days
FROM (
  SELECT flock_id, record_date FROM public.daily_records
  WHERE shed_id IS NULL GROUP BY flock_id, record_date HAVING COUNT(*) > 1
) dup
JOIN public.flocks f ON f.id = dup.flock_id
GROUP BY f.flock_no ORDER BY f.flock_no;

SELECT 'sentinel' AS marker, 1 AS n;
