-- Removes July 2026 salary rows for employees who had not joined yet.
--
-- Cause (fixed in code this session): Bulk Salary listed employees using only
-- `is_active = true` and never applied the selected month, so everyone on the
-- payroll today appeared in every month — including 8 staff who joined
-- 01/08/2026. Saving the sheet then created real salary_monthly rows for them
-- against July, a month they did not work.
--
-- Deleting only rows where the employee's joining_date is AFTER the month
-- ended, and only where nothing has been paid against them — a row already
-- marked paid is left alone and reported below for manual review, since
-- deleting it would erase a record of money that actually moved.

-- Safety first: list anything we are about to skip because it looks paid
SELECT 'skipped_because_paid' AS chk, e.emp_id, e.name, e.joining_date,
  s.net_salary, s.is_paid
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = '2026-07-01'
  AND e.joining_date > '2026-07-31'
  AND COALESCE(s.is_paid, FALSE) = TRUE;

DELETE FROM public.salary_monthly s
USING public.employees e
WHERE e.id = s.employee_id
  AND s.month = '2026-07-01'
  AND e.joining_date > '2026-07-31'
  AND COALESCE(s.is_paid, FALSE) = FALSE;

-- Verify: should be 0 remaining July rows for post-July joiners
SELECT 'remaining_pre_join_rows' AS chk, COUNT(*) AS rows_left
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = '2026-07-01' AND e.joining_date > '2026-07-31';

-- Context: total July rows now, and how many employees genuinely qualify
SELECT 'july_totals' AS chk,
  (SELECT COUNT(*) FROM public.salary_monthly WHERE month = '2026-07-01') AS july_salary_rows,
  (SELECT COUNT(*) FROM public.employees
     WHERE (joining_date IS NULL OR joining_date <= '2026-07-31')
       AND (leaving_date IS NULL OR leaving_date >= '2026-07-01')) AS employed_in_july;

SELECT 'sentinel' AS marker, 1 AS n;
