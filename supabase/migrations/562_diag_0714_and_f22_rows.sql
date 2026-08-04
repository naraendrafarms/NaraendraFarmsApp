-- Diagnostic only (no schema changes) — 561's output was truncated before
-- showing the 2026-07-14 rows. Key finding so far, by comparing grade
-- totals against the per-shed HE egg count for the same day:
--   2026-06-01: shed HE 22,679 vs grades 22,679  -> CORRECT (extra row is empty)
--   2026-06-24: shed HE 21,429 vs grades 21,429  -> CORRECT (extra row is empty)
--   2026-07-14: shed HE 20,823 vs grades 41,646  -> EXACTLY DOUBLE (both rows carry grades)
-- So only 2026-07-14 is genuinely doubled. Pulling its two rows, plus
-- Flock 22's two dates, to decide precisely which row to remove.
SELECT f.flock_no, d.record_date, d.id, d.farm_id,
  d.he_grade_a, d.he_grade_b, d.he_grade_c,
  (COALESCE(d.he_grade_a,0)+COALESCE(d.he_grade_b,0)+COALESCE(d.he_grade_c,0)) AS grade_total,
  d.he_eggs, d.total_eggs, d.remarks, d.created_at
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.shed_id IS NULL
  AND (
    (f.flock_no = '20' AND d.record_date = '2026-07-14')
    OR (f.flock_no = '22' AND d.record_date IN ('2026-05-17','2026-06-29'))
  )
ORDER BY f.flock_no, d.record_date, d.created_at;

SELECT 'sentinel' AS marker, 1 AS n;
