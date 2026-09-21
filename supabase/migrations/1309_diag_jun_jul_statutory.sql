-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner sent the filed June and July 2026 ESIC and EPFO returns. Pull the
-- app's own figures for those months so they can be compared. No filed figure
-- is written into this file - those are the employees' pay records and do not
-- belong in the repository; the comparison is done outside it.
--
-- August is included as the control, since it was already checked and tied.
--
-- NOTE on LEAST: a salary row can hold basic_salary NULL (a month with no work
-- earns null, not 0), and Postgres LEAST SKIPS a NULL argument - LEAST(NULL,
-- 15000) is 15000, not NULL. That made an earlier diagnostic overstate the PF
-- wage base by exactly one capped salary. COALESCE first, every time.

-- 1. ESI totals per month, on both bases
SELECT to_char(s.month, 'Mon YYYY') AS mon,
       count(*)::int                                  AS people,
       round(sum(COALESCE(s.basic_salary,0)))::int    AS wage_base,
       round(sum(COALESCE(s.esi_employee,0)))::int    AS employee,
       round(sum(COALESCE(s.esi_employer,0)))::int    AS employer_per_person,
       ceil(sum(COALESCE(s.basic_salary,0)) * 0.0325)::int AS employer_challan
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month IN (DATE '2026-06-01', DATE '2026-07-01', DATE '2026-08-01')
  AND e.esi_applicable IS TRUE
GROUP BY s.month ORDER BY s.month;

-- 2. PF totals per month
SELECT to_char(s.month, 'Mon YYYY') AS mon,
       count(*)::int AS members,
       round(sum(CASE WHEN e.restrict_pf THEN LEAST(COALESCE(s.basic_salary,0), 15000)
                      ELSE COALESCE(s.basic_salary,0) END))::int AS pf_wage,
       round(sum(COALESCE(s.pf_employee,0)))::int       AS ee,
       round(sum(COALESCE(s.employer_eps,0)))::int      AS eps,
       round(sum(COALESCE(s.employer_epf_diff,0)))::int AS er_diff,
       round(sum(COALESCE(s.admin_charges,0)))::int     AS admin,
       round(sum(COALESCE(s.edli_charge,0)))::int       AS edli
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month IN (DATE '2026-06-01', DATE '2026-07-01', DATE '2026-08-01')
  AND e.pf_applicable IS TRUE
GROUP BY s.month ORDER BY s.month;

-- 3. June, part-month and zero people in the statutory sets
SELECT COALESCE(string_agg(left(e.name,11) || ' ' || s.days_worked || 'd ' ||
                round(COALESCE(s.basic_salary,0))::int, ' | ' ORDER BY e.name), 'none') AS jun_part
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-06-01'
  AND (e.esi_applicable IS TRUE OR e.pf_applicable IS TRUE)
  AND COALESCE(s.days_worked, 0) < COALESCE(s.month_days, 0);

-- 4. July, same
SELECT COALESCE(string_agg(left(e.name,11) || ' ' || s.days_worked || 'd ' ||
                round(COALESCE(s.basic_salary,0))::int, ' | ' ORDER BY e.name), 'none') AS jul_part
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-07-01'
  AND (e.esi_applicable IS TRUE OR e.pf_applicable IS TRUE)
  AND COALESCE(s.days_worked, 0) < COALESCE(s.month_days, 0);

-- 5. How complete are those months at all
SELECT to_char(s.month, 'Mon YYYY') AS mon,
       count(*)::int AS rows_total,
       count(*) FILTER (WHERE s.paid_date IS NOT NULL)::int AS marked_paid,
       count(*) FILTER (WHERE COALESCE(s.net_salary,0) = 0)::int AS zero_net,
       max(s.month_days)::int AS month_days,
       round(sum(COALESCE(s.net_salary,0)))::int AS net_total
FROM public.salary_monthly s
WHERE s.month IN (DATE '2026-06-01', DATE '2026-07-01', DATE '2026-08-01')
GROUP BY s.month ORDER BY s.month;
