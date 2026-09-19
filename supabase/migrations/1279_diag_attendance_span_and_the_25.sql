-- READ ONLY. 1278 found 0 employees with a full-month gap in attendance. That
-- test is only meaningful if attendance covers enough months for a gap to be
-- possible, and I never measured how far attendance_daily goes back. Also:
-- are the 25 pre-joining employees rejoiners, or is attendance simply marked
-- from the 1st of the joining month? Measuring, not assuming. No writes.

SELECT min(attendance_date)::text AS first_attendance_anywhere,
       max(attendance_date)::text AS last_attendance_anywhere,
       count(DISTINCT date_trunc('month', attendance_date))::int AS distinct_months,
       count(DISTINCT employee_id)::int AS employees,
       count(*)::int AS rows
FROM public.attendance_daily;

SELECT count(*)::int AS employees_total,
       count(*) FILTER (WHERE COALESCE(is_active,true))::int   AS active,
       count(*) FILTER (WHERE NOT COALESCE(is_active,true))::int AS inactive,
       count(*) FILTER (WHERE joining_date IS NULL)::int       AS no_joining_date,
       count(*) FILTER (WHERE leaving_date IS NOT NULL)::int   AS has_leaving_date,
       count(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.attendance_daily a WHERE a.employee_id = e.id))::int AS never_marked_in_attendance
FROM public.employees e;

WITH bad AS (
  SELECT a.employee_id,
         min(a.attendance_date) AS first_bad,
         max(a.attendance_date) AS last_bad,
         count(*)::int          AS bad_days,
         count(DISTINCT date_trunc('month', a.attendance_date))::int AS bad_months
  FROM public.attendance_daily a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE e.joining_date IS NOT NULL AND a.attendance_date < e.joining_date
  GROUP BY a.employee_id
)
SELECT count(*)::int AS employees_with_pre_joining_attendance,
       sum(b.bad_days)::int AS bad_days_total,
       count(*) FILTER (WHERE date_trunc('month', b.first_bad) = date_trunc('month', e.joining_date))::int
         AS all_within_the_joining_month,
       count(*) FILTER (WHERE date_trunc('month', b.first_bad) < date_trunc('month', e.joining_date))::int
         AS starts_in_an_earlier_month,
       max((e.joining_date - b.first_bad))::int AS max_days_before_joining,
       count(*) FILTER (WHERE b.bad_months > 1)::int AS spans_more_than_one_month
FROM bad b JOIN public.employees e ON e.id = b.employee_id;

SELECT to_char(month,'YYYY-MM') AS salary_month,
       count(*) FILTER (WHERE NOT COALESCE(is_paid,false))::int AS not_marked_paid,
       count(*) FILTER (WHERE NOT COALESCE(is_paid,false) AND COALESCE(net_salary,0) = 0)::int AS of_which_net_is_zero,
       round(COALESCE(sum(net_salary) FILTER (WHERE NOT COALESCE(is_paid,false)),0))::int AS net_still_unpaid
FROM public.salary_monthly
GROUP BY to_char(month,'YYYY-MM')
ORDER BY 1 DESC LIMIT 8;
