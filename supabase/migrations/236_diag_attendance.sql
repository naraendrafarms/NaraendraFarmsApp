-- Diagnostic only — summarize what actually exists in attendance_daily right now
SELECT
  count(*) AS total_rows,
  min(attendance_date) AS earliest,
  max(attendance_date) AS latest,
  count(*) FILTER (WHERE status = 'P') AS present_rows,
  count(*) FILTER (WHERE status = 'A') AS absent_rows,
  count(DISTINCT to_char(attendance_date,'YYYY-MM')) AS distinct_months,
  count(*) FILTER (WHERE to_char(attendance_date,'YYYY-MM') = '2026-06') AS june_2026_rows
FROM public.attendance_daily;
