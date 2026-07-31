-- Diagnostic only (no schema changes) — comparing total HE (Hatching Eggs)
-- between the source Excel (7,238,063, computed directly from the file)
-- and what's actually saved in the app for Flock 19 across the same window.
SELECT sum(he_eggs) AS total_he_in_app, count(*) AS rows_counted
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date >= '2025-06-23' AND record_date <= '2026-06-02'
  AND shed_id IS NOT NULL;

SELECT 'sentinel' AS marker, 1 AS n;
