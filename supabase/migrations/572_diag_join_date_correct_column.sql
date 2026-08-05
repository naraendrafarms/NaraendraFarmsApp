-- Diagnostic only (no schema changes) — 571 used `join_date`, but the real
-- column is `joining_date`, so those statements errored and run_sql.py
-- silently reported success (it treats "does not exist" as OK). Re-running
-- with the correct column name.

-- 1. Active employees who joined AFTER July 2026 ended — wrongly listed in
--    the July Bulk Salary sheet
SELECT 'joined_after_july' AS chk, COUNT(*) AS employees
FROM public.employees
WHERE is_active = TRUE AND joining_date > '2026-07-31';

-- 2. Name them
SELECT emp_id, name, joining_date, is_active
FROM public.employees
WHERE is_active = TRUE AND joining_date > '2026-07-31'
ORDER BY joining_date, emp_id
LIMIT 25;

-- 3. Did any of them actually get a July salary row SAVED (not just listed)?
SELECT 'july_salary_rows' AS chk, COUNT(*) AS rows_saved
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = '2026-07-01' AND e.joining_date > '2026-07-31';

-- 4. The mirror-image risk: anyone who LEFT before July but is still active,
--    or who worked in July yet is now inactive and would be missing.
SELECT 'inactive_with_july_salary' AS chk, COUNT(*) AS employees
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = '2026-07-01' AND e.is_active = FALSE;

SELECT 'sentinel' AS marker, 1 AS n;
