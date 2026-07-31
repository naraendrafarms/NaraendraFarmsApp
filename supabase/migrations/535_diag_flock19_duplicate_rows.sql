-- Diagnostic only (no schema changes) — 534 found 1676 daily_records rows
-- for Flock 19 in this window, but the source file only has 1380 (345
-- dates x 4 sheds). Checking whether the extra 296 are pre-existing
-- shed_id IS NULL rows (e.g. from an earlier "Flock mode" entry or a grade-
-- only row) sitting alongside the new per-shed rows from this import —
-- which would double-count production if so.
SELECT count(*) AS null_shed_rows,
  count(*) FILTER (WHERE he_eggs > 0 OR je_eggs > 0 OR te_eggs > 0 OR be_eggs > 0 OR le_eggs > 0
                       OR mortality_female > 0 OR mortality_male > 0 OR feed_female_kg > 0 OR feed_male_kg > 0) AS null_shed_with_real_data,
  count(*) FILTER (WHERE he_grade_a IS NOT NULL OR he_grade_b IS NOT NULL OR he_grade_c IS NOT NULL) AS null_shed_with_grade
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date >= '2025-06-23' AND record_date <= '2026-06-02'
  AND shed_id IS NULL;

-- Sample a few of the null-shed rows that also carry real production data
-- (i.e. NOT just a grade-breakdown row) to see what they actually are
SELECT record_date, opening_female, opening_male, he_eggs, je_eggs, te_eggs, be_eggs,
  mortality_female, mortality_male, feed_female_kg, feed_male_kg, remarks
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date >= '2025-06-23' AND record_date <= '2026-06-02'
  AND shed_id IS NULL
  AND (he_eggs > 0 OR je_eggs > 0 OR te_eggs > 0 OR be_eggs > 0 OR le_eggs > 0
       OR mortality_female > 0 OR mortality_male > 0 OR feed_female_kg > 0 OR feed_male_kg > 0)
ORDER BY record_date
LIMIT 10;

-- Also check: does the per-shed row count for a SINGLE known date exceed 4
-- (i.e. are there duplicate per-shed rows too, not just null-shed ones)?
SELECT record_date, shed_id, count(*) AS n
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date = '2025-06-23' AND shed_id IS NOT NULL
GROUP BY record_date, shed_id
HAVING count(*) > 1;

SELECT 'sentinel' AS marker, 1 AS n;
