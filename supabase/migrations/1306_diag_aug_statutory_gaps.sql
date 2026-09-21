-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- 1305 showed the app's August statutory contributions match the filed returns
-- to the rupee on the employee side, but the PF WAGE BASE the Statutory Filing
-- page would file is 15,000 higher than what was actually filed. Exactly one
-- person's capped wage. Find who, without writing any filed figure into the
-- repository.
--
-- The runner only prints about 500 characters of each statement's result, so
-- the wide lists are rolled into a single string per statement.

-- 1. Anyone in the statutory sets who worked no days, or has no basic at all
SELECT e.name,
       e.esi_applicable AS esi,
       e.pf_applicable  AS pf,
       s.days_worked    AS d,
       round(s.basic_salary)::int  AS basic,
       round(s.earned_salary)::int AS earned,
       round(s.esi_employee)::int  AS esi_ee,
       round(s.pf_employee)::int   AS pf_ee
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01'
  AND (e.esi_applicable IS TRUE OR e.pf_applicable IS TRUE)
  AND (COALESCE(s.days_worked, 0) = 0 OR COALESCE(s.basic_salary, 0) = 0)
ORDER BY e.name;

-- 2. Part-month people in the statutory sets: contracted basic vs earned
SELECT COALESCE(string_agg(e.name || ' ' || s.days_worked || 'd b' ||
                round(s.basic_salary)::int || ' e' || round(s.earned_salary)::int,
                ' | ' ORDER BY e.name), 'none') AS part_month
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01'
  AND (e.esi_applicable IS TRUE OR e.pf_applicable IS TRUE)
  AND COALESCE(s.days_worked, 0) > 0
  AND s.days_worked < s.month_days;

-- 3. PF people at or above the 15,000 ceiling, and whether restrict_pf is set
SELECT COALESCE(string_agg(e.name || ' b' || round(s.basic_salary)::int ||
                ' cap=' || COALESCE(e.restrict_pf, false)::text ||
                ' ee' || round(s.pf_employee)::int,
                ' | ' ORDER BY e.name), 'none') AS at_or_over_ceiling
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01'
  AND e.pf_applicable IS TRUE
  AND COALESCE(s.basic_salary, 0) >= 15000;

-- 4. The wage bases the Statutory Filing page itself would file, by its own
--    formulas: PF wage = restrict_pf ? min(basic,15000) : basic, EPS wage =
--    min(basic,15000), ESI wage = basic where basic <= 21000.
SELECT 'page would file' AS line,
       count(*) FILTER (WHERE e.pf_applicable)::int AS pf_people,
       round(sum(CASE WHEN e.pf_applicable THEN
              CASE WHEN e.restrict_pf THEN LEAST(s.basic_salary, 15000)
                   ELSE s.basic_salary END ELSE 0 END))::int AS pf_wage,
       round(sum(CASE WHEN e.pf_applicable
                      THEN LEAST(s.basic_salary, 15000) ELSE 0 END))::int AS eps_wage,
       count(*) FILTER (WHERE e.esi_applicable AND s.basic_salary <= 21000)::int AS esi_people,
       round(sum(CASE WHEN e.esi_applicable AND s.basic_salary <= 21000
                      THEN s.basic_salary ELSE 0 END))::int AS esi_wage
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01';

-- 5. Do the two statutory sets line up with each other the way the filings do
SELECT count(*) FILTER (WHERE e.esi_applicable AND NOT COALESCE(e.pf_applicable,false))::int AS esi_only,
       count(*) FILTER (WHERE e.pf_applicable AND NOT COALESCE(e.esi_applicable,false))::int AS pf_only,
       count(*) FILTER (WHERE e.esi_applicable AND e.pf_applicable)::int AS both,
       COALESCE(string_agg(e.name, ', ' ORDER BY e.name)
                FILTER (WHERE e.pf_applicable AND NOT COALESCE(e.esi_applicable,false)), 'none') AS pf_only_names
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01'
  AND (e.esi_applicable IS TRUE OR e.pf_applicable IS TRUE);
