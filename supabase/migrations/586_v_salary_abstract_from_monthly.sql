-- Salary reports read the wrong table.
--
-- Measured in 585: salary_abstract holds 0 rows while salary_monthly holds 723
-- (Jun-26 217 = Rs 26.68L, Jul-26 248 = Rs 30.36L, Aug-26 258). salary_abstract
-- is only ever written by the Excel importer; the Bulk Salary run writes
-- salary_monthly. So three reports were reading a table nothing fills:
--   Reports -> Salary Report      (blank for every financial year)
--   Reports -> Flock P&L (Full)   (salary cost read as zero)
--   Reports -> Company P&L        (salary cost read as zero — the P&L was
--                                  understating cost by ~Rs 57L for Jun+Jul)
--
-- This view presents salary_monthly in exactly the shape salary_abstract has,
-- so the reports keep the same columns and only their source changes. Derived
-- on read rather than copied into a second table: a copy would need keeping in
-- step with every salary edit, and would silently drift the day it wasn't.
--
-- The site comes from the employee, since salary_monthly is per employee.
-- Employees with no farm_id group under NULL and still count in company totals.

DROP VIEW IF EXISTS public.v_salary_abstract;

CREATE VIEW public.v_salary_abstract AS
SELECT
  e.farm_id                                   AS farm_id,
  s.month                                     AS month,
  SUM(COALESCE(s.earned_salary, 0))           AS total_salary,
  SUM(COALESCE(s.advance, 0))                 AS total_advance,
  SUM(COALESCE(s.tds, 0))                     AS total_tds,
  SUM(COALESCE(s.net_salary, 0))              AS net_salary,
  COUNT(*)                                    AS employee_count
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
GROUP BY e.farm_id, s.month;

GRANT SELECT ON public.v_salary_abstract TO authenticated;

-- Verification (leading statements so run_sql.py echoes them).
SELECT COUNT(*) AS view_rows,
       MIN(month)::text AS first_month,
       MAX(month)::text AS last_month,
       ROUND(SUM(net_salary)) AS total_net
FROM public.v_salary_abstract;

SELECT COALESCE(string_agg(m || '=' || emp || '/' || amt, ', ' ORDER BY m), 'NONE') AS by_month
FROM (
  SELECT to_char(month, 'YYYY-MM') AS m,
         SUM(employee_count) AS emp,
         ROUND(SUM(net_salary)) AS amt
  FROM public.v_salary_abstract
  WHERE month BETWEEN '2026-04-01' AND '2027-03-31'
  GROUP BY to_char(month, 'YYYY-MM')
) x;

NOTIFY pgrst, 'reload schema';
