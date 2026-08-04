-- Repairs doubled HE grade production in the Daily Stock Register.
--
-- Cause: daily_records keeps ONE flock-level row per flock/day (shed_id IS
-- NULL) carrying the Grade A/B/C breakdown. Migration 086's unique index is
-- (flock_id, record_date, farm_id) WHERE shed_id IS NULL — because Postgres
-- never treats two NULLs as equal, a row saved with farm_id NULL does not
-- collide with one that has farm_id set, so the same day could be saved
-- twice. The register sums grades across all rows for a date, so those days
-- showed exactly double.
--
-- Confirmed example (Flock 20, 2026-07-14): two rows created 7 minutes
-- apart with IDENTICAL grades 928/19156/739, one with farm_id NULL. Actual
-- per-shed HE production that day was 20,823 = exactly one row's total.
--
-- This migration ONLY deletes rows that are provably safe to remove:
--   (a) flock-level rows with no grade data at all, where a sibling row for
--       the same flock/day does carry grades; and
--   (b) exact-duplicate flock-level rows (identical A/B/C), keeping one.
-- Anything else is left untouched and reported at the end for manual review.

-- (a) Drop empty flock-level rows that sit alongside a grade-bearing sibling
DELETE FROM public.daily_records d
WHERE d.shed_id IS NULL
  AND COALESCE(d.he_grade_a,0) = 0 AND COALESCE(d.he_grade_b,0) = 0 AND COALESCE(d.he_grade_c,0) = 0
  AND COALESCE(d.he_eggs,0) = 0 AND COALESCE(d.total_eggs,0) = 0
  AND EXISTS (
    SELECT 1 FROM public.daily_records s
    WHERE s.shed_id IS NULL AND s.flock_id = d.flock_id AND s.record_date = d.record_date
      AND s.id <> d.id
      AND (COALESCE(s.he_grade_a,0) + COALESCE(s.he_grade_b,0) + COALESCE(s.he_grade_c,0)) > 0
  );

-- (b) Collapse exact-duplicate flock-level rows to a single row. Keeps the
--     row that has farm_id set (falling back to the newest) so the surviving
--     row is the fully-formed one.
DELETE FROM public.daily_records d
USING (
  SELECT id, ROW_NUMBER() OVER (
           PARTITION BY flock_id, record_date,
                        COALESCE(he_grade_a,0), COALESCE(he_grade_b,0), COALESCE(he_grade_c,0)
           ORDER BY (farm_id IS NOT NULL) DESC, created_at DESC
         ) AS rn
  FROM public.daily_records
  WHERE shed_id IS NULL
) ranked
WHERE d.id = ranked.id AND ranked.rn > 1;

-- Verify 1: any flock/day still holding more than one flock-level row —
-- these have DIFFERING values and need a human decision. Expect 0 rows.
SELECT f.flock_no, d.record_date, COUNT(*) AS remaining_rows,
  SUM(COALESCE(d.he_grade_a,0)+COALESCE(d.he_grade_b,0)+COALESCE(d.he_grade_c,0)) AS grade_total
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.shed_id IS NULL
GROUP BY f.flock_no, d.record_date
HAVING COUNT(*) > 1
ORDER BY f.flock_no, d.record_date;

-- Verify 2: the reported day should now read 20,823 (was 41,646)
SELECT 'flock20_0714' AS chk, COUNT(*) AS flock_level_rows,
  SUM(he_grade_a) AS grade_a, SUM(he_grade_b) AS grade_b, SUM(he_grade_c) AS grade_c,
  SUM(COALESCE(he_grade_a,0)+COALESCE(he_grade_b,0)+COALESCE(he_grade_c,0)) AS grade_total
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')
  AND record_date = '2026-07-14' AND shed_id IS NULL;

SELECT 'sentinel' AS marker, 1 AS n;
