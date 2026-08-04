-- Diagnostic only (no schema changes) — showing BOTH flock-level rows for
-- each of the 5 affected days, so it's clear which one to keep before any
-- deletion. Also confirms whether farm_id being NULL is what let the
-- unique index (flock_id, record_date, farm_id) WHERE shed_id IS NULL
-- allow a second row through.
SELECT f.flock_no, d.record_date, d.id, d.farm_id,
  d.he_grade_a, d.he_grade_b, d.he_grade_c,
  (COALESCE(d.he_grade_a,0)+COALESCE(d.he_grade_b,0)+COALESCE(d.he_grade_c,0)) AS grade_total,
  d.he_eggs, d.total_eggs, d.opening_female, d.mortality_female,
  d.wastage_he, d.remarks, d.created_at
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.shed_id IS NULL
  AND (d.flock_id, d.record_date) IN (
    SELECT flock_id, record_date FROM public.daily_records
    WHERE shed_id IS NULL GROUP BY flock_id, record_date HAVING COUNT(*) > 1
  )
ORDER BY f.flock_no, d.record_date, d.created_at;

-- For context: the per-shed HE total on those same days, so the correct
-- grade total can be sanity-checked against actual production.
SELECT f.flock_no, d.record_date,
  SUM(d.he_eggs) AS shed_he_eggs, COUNT(*) AS shed_rows
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.shed_id IS NOT NULL
  AND (d.flock_id, d.record_date) IN (
    SELECT flock_id, record_date FROM public.daily_records
    WHERE shed_id IS NULL GROUP BY flock_id, record_date HAVING COUNT(*) > 1
  )
GROUP BY f.flock_no, d.record_date
ORDER BY f.flock_no, d.record_date;

SELECT 'sentinel' AS marker, 1 AS n;
