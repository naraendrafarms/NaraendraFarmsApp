-- Diagnostic only — check what got written to July 2026 that the user didn't enter
SELECT
  count(*) AS total_rows,
  min(attendance_date) AS earliest,
  max(attendance_date) AS latest,
  count(*) FILTER (WHERE status = 'P') AS present_rows,
  count(DISTINCT employee_id) AS distinct_employees
FROM public.attendance_daily
WHERE attendance_date >= '2026-07-01' AND attendance_date <= '2026-07-31';
