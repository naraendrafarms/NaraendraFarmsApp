-- READ ONLY. Two things I asserted without measuring, now measured.
-- (1) I called September "paid". A salary_monthly row means the salary was
--     COMPUTED. paid_date / is_paid say whether it was disbursed.
-- (2) I called 333 attendance rows "wrong" because attendance_date <
--     joining_date. If a man leaves and rejoins, joining_date holds only the
--     LATER date, so his earlier genuine attendance looks wrong. Checking
--     whether those employees are rejoiners before calling anything wrong.
-- No writes. Nothing is changed by this file.

SELECT to_char(month,'YYYY-MM')                                   AS salary_month,
       count(*)::int                                              AS rows_computed,
       count(*) FILTER (WHERE COALESCE(is_paid,false))::int        AS marked_paid,
       count(*) FILTER (WHERE paid_date IS NOT NULL)::int          AS has_paid_date,
       count(*) FILTER (WHERE NOT COALESCE(is_paid,false))::int    AS not_marked_paid,
       round(sum(COALESCE(net_salary,0)))::int                     AS net_computed,
       round(sum(COALESCE(net_salary,0)) FILTER (WHERE COALESCE(is_paid,false)))::int AS net_marked_paid
FROM public.salary_monthly
GROUP BY to_char(month,'YYYY-MM')
ORDER BY 1 DESC LIMIT 8;

SELECT COALESCE(is_paid,false)        AS is_paid,
       (paid_date IS NOT NULL)        AS paid_date_set,
       min(paid_date)::text           AS earliest_paid_date,
       max(paid_date)::text           AS latest_paid_date,
       count(*)::int                  AS rows,
       round(sum(COALESCE(net_salary,0)))::int AS net_salary
FROM public.salary_monthly
WHERE month = date '2026-09-01'
GROUP BY 1,2 ORDER BY 1,2;

WITH att AS (
  SELECT employee_id,
         min(attendance_date) AS first_att,
         max(attendance_date) AS last_att,
         count(DISTINCT date_trunc('month', attendance_date)) AS months_present,
         (extract(year  FROM age(date_trunc('month',max(attendance_date)),
                                 date_trunc('month',min(attendance_date))))*12
        + extract(month FROM age(date_trunc('month',max(attendance_date)),
                                 date_trunc('month',min(attendance_date)))) + 1)::int AS months_span
  FROM public.attendance_daily GROUP BY employee_id
)
SELECT count(*)::int AS employees_with_attendance,
       count(*) FILTER (WHERE a.months_span > a.months_present)::int AS have_a_full_month_gap,
       count(*) FILTER (WHERE e.joining_date IS NOT NULL AND a.first_att < e.joining_date)::int AS attendance_before_joining_date,
       count(*) FILTER (WHERE e.joining_date IS NOT NULL AND a.first_att < e.joining_date
                          AND a.months_span > a.months_present)::int AS both_gap_and_pre_joining,
       count(*) FILTER (WHERE e.leaving_date IS NOT NULL)::int AS have_a_leaving_date,
       count(*) FILTER (WHERE e.leaving_date IS NOT NULL AND a.last_att > e.leaving_date)::int AS attendance_after_leaving_date,
       count(*) FILTER (WHERE NOT COALESCE(e.is_active,true))::int AS inactive
FROM att a JOIN public.employees e ON e.id = a.employee_id;

WITH att AS (
  SELECT employee_id,
         min(attendance_date) AS first_att,
         max(attendance_date) AS last_att,
         count(DISTINCT date_trunc('month', attendance_date)) AS months_present,
         (extract(year  FROM age(date_trunc('month',max(attendance_date)),
                                 date_trunc('month',min(attendance_date))))*12
        + extract(month FROM age(date_trunc('month',max(attendance_date)),
                                 date_trunc('month',min(attendance_date)))) + 1)::int AS months_span
  FROM public.attendance_daily GROUP BY employee_id
)
SELECT e.emp_id, e.name,
       e.joining_date::text AS joining_date, e.leaving_date::text AS leaving_date,
       COALESCE(e.is_active,true) AS active,
       a.first_att::text AS first_attendance, a.last_att::text AS last_attendance,
       a.months_present, a.months_span,
       (a.months_span - a.months_present)::int AS gap_months
FROM att a JOIN public.employees e ON e.id = a.employee_id
WHERE e.joining_date IS NOT NULL AND a.first_att < e.joining_date
ORDER BY (a.months_span - a.months_present) DESC, a.first_att LIMIT 30;
