-- Diagnostic only (no schema changes) — employees who joined 01/08/2026 are
-- appearing in the JULY 2026 Bulk Salary sheet.
--
-- Code check (EmployeePages.tsx, Bulk Salary): the employee list is fetched
-- with only `.eq('is_active', true)` — there is NO join-date or leaving-date
-- condition, and the selected month is never passed to that query. So every
-- currently-active employee is listed for whatever month is chosen, including
-- people who had not joined yet (and, conversely, people who have since left
-- would be missing from months they actually worked).
-- The Monthly Attendance grid was fixed for exactly this in a past release;
-- Bulk Salary was never given the same treatment.
--
-- Confirming against real data before changing anything.

-- 1. Which date columns exist to filter on
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='employees'
  AND (column_name ILIKE '%join%' OR column_name ILIKE '%left%' OR column_name ILIKE '%exit%'
       OR column_name ILIKE '%resign%' OR column_name ILIKE '%doj%' OR column_name = 'is_active')
ORDER BY column_name;

-- 2. Active employees who joined AFTER July 2026 ended — these are the ones
--    wrongly listed in the July sheet
SELECT 'joined_after_july' AS chk, COUNT(*) AS employees
FROM public.employees
WHERE is_active = TRUE AND join_date > '2026-07-31';

-- 3. Name them (first 25)
SELECT emp_id, name, join_date, is_active
FROM public.employees
WHERE is_active = TRUE AND join_date > '2026-07-31'
ORDER BY join_date, emp_id
LIMIT 25;

-- 4. Did any of them actually get a July salary row saved?
SELECT 'july_salary_rows' AS chk, COUNT(*) AS rows_saved
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = '2026-07-01' AND e.join_date > '2026-07-31';

SELECT 'sentinel' AS marker, 1 AS n;
