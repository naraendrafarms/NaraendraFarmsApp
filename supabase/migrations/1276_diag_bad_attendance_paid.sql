-- READ ONLY. 333 attendance days were marked BEFORE the person joined, across
-- 25 employees, 01/07/2026 to 19/08/2026. Did those days reach a salary run?
SELECT 1 AS warmup;

-- Salary runs that exist at all, so the months in question can be placed.
SELECT to_char(salary_month, 'YYYY-MM') AS month,
       count(*)::int                    AS employees_paid,
       round(sum(COALESCE(net_salary,0)))::int AS net_paid
FROM public.salary_monthly
GROUP BY to_char(salary_month, 'YYYY-MM')
ORDER BY 1 DESC LIMIT 6;

-- The 25 affected employees: bad days per month, and whether a salary row
-- exists for that same employee and month.
WITH bad AS (
  SELECT a.employee_id, to_char(a.attendance_date, 'YYYY-MM') AS ym,
         count(*)::int AS bad_days
  FROM public.attendance_daily a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date
  GROUP BY a.employee_id, to_char(a.attendance_date, 'YYYY-MM')
)
SELECT b.ym AS month,
       count(*)::int                                            AS employees_with_bad_days,
       sum(b.bad_days)::int                                     AS bad_days_total,
       count(*) FILTER (WHERE s.id IS NOT NULL)::int            AS of_which_have_a_salary_row,
       round(COALESCE(sum(s.net_salary) FILTER (WHERE s.id IS NOT NULL),0))::int AS net_paid_to_those
FROM bad b
LEFT JOIN public.salary_monthly s
       ON s.employee_id = b.employee_id
      AND to_char(s.salary_month, 'YYYY-MM') = b.ym
GROUP BY b.ym ORDER BY b.ym;

-- Name by name for any that WERE paid, with the days paid on the salary row.
WITH bad AS (
  SELECT a.employee_id, to_char(a.attendance_date, 'YYYY-MM') AS ym, count(*)::int AS bad_days
  FROM public.attendance_daily a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date
  GROUP BY a.employee_id, to_char(a.attendance_date, 'YYYY-MM')
)
SELECT e.emp_id, e.name, b.ym AS month, e.joining_date::text AS joined,
       b.bad_days, s.days_present, round(COALESCE(s.net_salary,0))::int AS net_salary
FROM bad b
JOIN public.employees e ON e.id = b.employee_id
JOIN public.salary_monthly s ON s.employee_id = b.employee_id
 AND to_char(s.salary_month,'YYYY-MM') = b.ym
ORDER BY b.bad_days DESC LIMIT 20;
