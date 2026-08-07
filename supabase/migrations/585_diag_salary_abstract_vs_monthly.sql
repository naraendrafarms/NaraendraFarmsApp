-- Diagnostic only (no schema changes).
--
-- Reports -> Salary Report shows nothing. In code it reads `salary_abstract`,
-- while the Bulk Salary run writes `salary_monthly`; the only place that
-- writes salary_abstract is the Excel importer. If salary_abstract is empty
-- the page can never show anything, no matter which financial year is picked.
-- Measure both tables before concluding.

SELECT
  (SELECT COUNT(*) FROM public.salary_abstract) AS abstract_rows,
  (SELECT COUNT(*) FROM public.salary_monthly)  AS monthly_rows,
  (SELECT MIN(month)::text FROM public.salary_abstract) AS abstract_first_month,
  (SELECT MAX(month)::text FROM public.salary_abstract) AS abstract_last_month,
  (SELECT MIN(month)::text FROM public.salary_monthly)  AS monthly_first_month,
  (SELECT MAX(month)::text FROM public.salary_monthly)  AS monthly_last_month;

-- Month-wise salary_monthly for FY 2026-27 — what the report SHOULD be able
-- to show if it read the table the app actually writes.
SELECT COALESCE(string_agg(m || '=' || rows || '/' || amt, ', ' ORDER BY m), 'NONE') AS monthly_by_month
FROM (
  SELECT to_char(month, 'YYYY-MM') AS m, COUNT(*) AS rows,
         ROUND(SUM(COALESCE(net_salary, 0))) AS amt
  FROM public.salary_monthly
  WHERE month BETWEEN '2026-04-01' AND '2027-03-31'
  GROUP BY to_char(month, 'YYYY-MM')
) x;

-- Same for salary_abstract, to show whether it holds anything for this FY.
SELECT COALESCE(string_agg(m || '=' || rows, ', ' ORDER BY m), 'NONE') AS abstract_by_month
FROM (
  SELECT to_char(month, 'YYYY-MM') AS m, COUNT(*) AS rows
  FROM public.salary_abstract
  WHERE month BETWEEN '2026-04-01' AND '2027-03-31'
  GROUP BY to_char(month, 'YYYY-MM')
) y;

-- Company P&L reads salary_abstract too, so if that table is empty the salary
-- line in Company P&L is understated. Show what it would pick up.
SELECT COALESCE(SUM(net_salary), 0) AS abstract_net_fy2627
FROM public.salary_abstract
WHERE month BETWEEN '2026-04-01' AND '2027-03-31';
