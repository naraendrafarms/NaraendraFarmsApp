-- Diagnostic only (no schema changes) — Bulk Salary's "From Daily Att."
-- column disagrees with the Absent Days that Monthly Attendance saved
-- (e.g. Laxmi Mahali: From Daily Att. = 2, Absent Days = 15) for Jul 2026.
--
-- Both are supposed to come from the same attendance_daily table. Prime
-- suspect: Bulk Salary's query reads attendance_daily with NO pagination
--   .select('employee_id,status').gte(start).lte(end)
-- so Supabase/PostgREST caps it at 1000 rows. With ~173 employees × 31 days
-- that's ~5,300 rows, meaning most days never reach the browser and the
-- absent counts come out far too low. Measuring the real row count.

-- 1. How many attendance_daily rows exist for Jul 2026 (vs the 1000 cap)
SELECT 'jul_rows' AS chk, COUNT(*) AS total_rows,
  COUNT(DISTINCT employee_id) AS employees,
  COUNT(DISTINCT attendance_date) AS days
FROM public.attendance_daily
WHERE attendance_date BETWEEN '2026-07-01' AND '2026-07-31';

-- 2. Status codes actually used — the counter only understands A / H;
--    anything else silently counts as 0 absent.
SELECT 'status_codes' AS chk, status, COUNT(*) AS rows
FROM public.attendance_daily
WHERE attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
GROUP BY status ORDER BY rows DESC;

-- 3. The reported employee: true absent days from daily attendance
SELECT 'laxmi_daily' AS chk, e.name, e.emp_id,
  COUNT(*) FILTER (WHERE a.status = 'A')  AS full_absent,
  COUNT(*) FILTER (WHERE a.status = 'H')  AS half_days,
  (COUNT(*) FILTER (WHERE a.status = 'A')) + 0.5 * (COUNT(*) FILTER (WHERE a.status = 'H')) AS computed_absent,
  COUNT(*) AS rows_for_month
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
WHERE a.attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
  AND e.name ILIKE '%Laxmi%Mahali%'
GROUP BY e.name, e.emp_id;

-- 4. What Monthly Attendance saved onto the salary row for the same person
SELECT 'laxmi_salary' AS chk, e.name, s.month, s.absent_days, s.month_days,
  s.present_days, s.half_days, s.wo_days
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = '2026-07-01' AND e.name ILIKE '%Laxmi%Mahali%';

SELECT 'sentinel' AS marker, 1 AS n;
