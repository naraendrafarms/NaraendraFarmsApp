-- READ ONLY. Redo of 1276, which named salary_month and days_present. The real
-- columns are month and days_worked (migration 001), so all three statements
-- errored and run_sql.py reported Errors: 0 because "does not exist" is
-- treated as success. Verified against the schema this time.
SELECT 1 AS warmup;

SELECT to_char(month, 'YYYY-MM') AS salary_month,
       count(*)::int             AS employees_paid,
       round(sum(COALESCE(net_salary,0)))::int AS net_paid
FROM public.salary_monthly
GROUP BY to_char(month, 'YYYY-MM')
ORDER BY 1 DESC LIMIT 6;

WITH bad AS (
  SELECT a.employee_id, to_char(a.attendance_date, 'YYYY-MM') AS ym, count(*)::int AS bad_days
  FROM public.attendance_daily a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date
  GROUP BY a.employee_id, to_char(a.attendance_date, 'YYYY-MM')
)
SELECT b.ym AS month,
       count(*)::int                                 AS employees_with_bad_days,
       sum(b.bad_days)::int                          AS bad_days_total,
       count(*) FILTER (WHERE s.id IS NOT NULL)::int AS of_which_have_a_salary_row,
       round(COALESCE(sum(s.net_salary) FILTER (WHERE s.id IS NOT NULL),0))::int AS net_paid_to_those
FROM bad b
LEFT JOIN public.salary_monthly s
       ON s.employee_id = b.employee_id AND to_char(s.month,'YYYY-MM') = b.ym
GROUP BY b.ym ORDER BY b.ym;

-- Anyone actually paid: days_worked is the figure the salary was built from.
WITH bad AS (
  SELECT a.employee_id, to_char(a.attendance_date, 'YYYY-MM') AS ym, count(*)::int AS bad_days
  FROM public.attendance_daily a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date
  GROUP BY a.employee_id, to_char(a.attendance_date, 'YYYY-MM')
)
SELECT e.emp_id, e.name, b.ym AS month, e.joining_date::text AS joined,
       b.bad_days, s.days_worked, round(COALESCE(s.net_salary,0))::int AS net_salary
FROM bad b
JOIN public.employees e ON e.id = b.employee_id
JOIN public.salary_monthly s ON s.employee_id = b.employee_id
 AND to_char(s.month,'YYYY-MM') = b.ym
ORDER BY b.bad_days DESC LIMIT 20;
