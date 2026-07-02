-- Diagnostic only (SELECT), no data changes. Check actual computed values
-- of the 207 June 2026 salary_monthly rows (not just the count) — are they
-- real numbers (entered directly in Bulk Salary) or all zero?
SELECT 'june_salary_summary' AS chk,
  count(*) AS n,
  count(*) FILTER (WHERE net_salary > 0) AS rows_with_net_salary,
  sum(net_salary) AS total_net_salary,
  sum(days_worked) AS total_days_worked
FROM public.salary_monthly WHERE month = '2026-06-01';

SELECT sm.id, e.emp_id, e.name, sm.days_worked, sm.gross_salary, sm.net_salary, f.name AS farm_name
FROM public.salary_monthly sm
JOIN public.employees e ON e.id = sm.employee_id
LEFT JOIN public.farms f ON f.id = e.farm_id
WHERE sm.month = '2026-06-01'
ORDER BY sm.net_salary DESC NULLS LAST
LIMIT 8;
