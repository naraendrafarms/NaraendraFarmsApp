-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner sent the two August 2026 statutory filings (ESIC contribution
-- history and the EPFO ECR return) and asked how they compare with the app.
-- This pulls the app's own August figures out so the two can be put side by
-- side. The filed figures are deliberately NOT written into this file — they
-- are the employees' pay and contribution records and do not belong in the
-- repository; the comparison is done outside it.
--
-- Three statements, each returns rows so none is swallowed by the runner.

-- 1. ESI: every employee flagged esi_applicable, as August stands in the app
SELECT e.emp_id,
       e.name,
       COALESCE(e.esi_no, '(none)')       AS esi_no,
       s.days_worked,
       s.month_days,
       s.absent_days,
       round(s.basic_salary)::int         AS basic,
       round(s.gross_salary)::int         AS gross,
       round(s.earned_salary)::int        AS earned,
       round(s.esi_employee)::int         AS esi_employee,
       round(s.esi_employer)::int         AS esi_employer
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01'
  AND e.esi_applicable IS TRUE
ORDER BY e.name;

-- 2. PF: every employee flagged pf_applicable, as August stands in the app
SELECT e.emp_id,
       e.name,
       COALESCE(e.uan_no, e.pf_no, '(none)') AS uan,
       e.restrict_pf,
       s.days_worked,
       s.month_days,
       (COALESCE(s.month_days,0) - COALESCE(s.days_worked,0)) AS ncp_days,
       round(s.basic_salary)::int         AS basic,
       round(s.gross_salary)::int         AS gross,
       round(s.pf_employee)::int          AS pf_employee,
       round(s.employer_eps)::int         AS employer_eps,
       round(s.employer_epf_diff)::int    AS employer_epf_diff,
       round(s.admin_charges)::int        AS admin_charges,
       round(s.edli_charge)::int          AS edli_charge
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01'
  AND e.pf_applicable IS TRUE
ORDER BY e.name;

-- 3. Totals, so the headline figures can be checked without adding up a list.
--    ESI wage base here is basic_salary, which is what computeSalaryForEmp
--    charges ESI on; PF wage base is basic capped at 15,000 where restrict_pf
--    is set, which is what the Statutory Filing page files on.
SELECT 'ESI applicable' AS line,
       count(*)::int                                   AS people,
       round(sum(s.basic_salary))::int                 AS wage_base,
       round(sum(s.esi_employee))::int                 AS employee_amt,
       round(sum(s.esi_employer))::int                 AS employer_amt,
       count(*) FILTER (WHERE COALESCE(s.basic_salary,0) > 21000)::int AS over_esi_ceiling
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01' AND e.esi_applicable IS TRUE
UNION ALL
SELECT 'PF applicable',
       count(*)::int,
       round(sum(CASE WHEN e.restrict_pf THEN LEAST(s.basic_salary, 15000)
                      ELSE s.basic_salary END))::int,
       round(sum(s.pf_employee))::int,
       round(sum(s.employer_eps) + sum(s.employer_epf_diff))::int,
       count(*) FILTER (WHERE e.uan_no IS NULL AND e.pf_no IS NULL)::int
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01' AND e.pf_applicable IS TRUE
UNION ALL
SELECT 'All August rows',
       count(*)::int,
       round(sum(s.gross_salary))::int,
       round(sum(s.net_salary))::int,
       count(*) FILTER (WHERE s.paid_date IS NOT NULL)::int,
       count(*) FILTER (WHERE COALESCE(s.net_salary,0) = 0)::int
FROM public.salary_monthly s
WHERE s.month = DATE '2026-08-01';
