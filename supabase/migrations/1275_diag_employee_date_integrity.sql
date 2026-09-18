-- READ ONLY. Attendance screens list employees without regard to when they
-- joined or left. Measure how far that has actually gone.
SELECT 1 AS warmup;

SELECT count(*)::int                                            AS employees_total,
       count(*) FILTER (WHERE is_active)::int                   AS active,
       count(*) FILTER (WHERE NOT is_active)::int               AS inactive,
       count(*) FILTER (WHERE joining_date IS NULL)::int        AS no_joining_date,
       count(*) FILTER (WHERE leaving_date IS NOT NULL)::int    AS have_left,
       count(*) FILTER (WHERE is_active AND leaving_date IS NOT NULL)::int AS active_but_have_a_leaving_date,
       min(joining_date)::text                                  AS earliest_joining,
       max(joining_date)::text                                  AS latest_joining
FROM public.employees;

-- The sharp one: attendance actually MARKED outside someone's employment.
SELECT count(*)::int AS attendance_rows_outside_employment,
       count(DISTINCT a.employee_id)::int AS employees_affected,
       count(*) FILTER (WHERE e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date)::int AS marked_before_joining,
       count(*) FILTER (WHERE e.leaving_date IS NOT NULL AND a.attendance_date > e.leaving_date)::int AS marked_after_leaving,
       min(a.attendance_date)::text AS earliest, max(a.attendance_date)::text AS latest
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
WHERE (e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date)
   OR (e.leaving_date  IS NOT NULL AND a.attendance_date > e.leaving_date);

-- Who, and how many days each, worst first.
SELECT e.emp_id, e.name, e.joining_date::text AS joined, e.leaving_date::text AS left_on,
       e.is_active,
       count(*)::int AS days_marked_outside,
       min(a.attendance_date)::text AS first_bad, max(a.attendance_date)::text AS last_bad
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
WHERE (e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date)
   OR (e.leaving_date  IS NOT NULL AND a.attendance_date > e.leaving_date)
GROUP BY e.emp_id, e.name, e.joining_date, e.leaving_date, e.is_active
ORDER BY count(*) DESC LIMIT 15;

-- Did any of it reach a salary run?
SELECT count(*)::int AS salary_rows, count(DISTINCT employee_id)::int AS employees_paid,
       min(salary_month)::text AS first_month, max(salary_month)::text AS last_month
FROM public.salary_monthly;
