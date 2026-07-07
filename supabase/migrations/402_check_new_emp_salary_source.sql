SELECT 'sentinel' AS marker, 1 AS n;

-- Last 10 employees created (any farm), with their created_at
SELECT e.id, e.emp_id, e.name, e.farm_id, e.created_at
FROM employees e
ORDER BY e.created_at DESC
LIMIT 10;

-- For those same employees, their salary_monthly rows for June 2026 + created_at of that row
SELECT sm.employee_id, e.emp_id, e.name, sm.month, sm.earned_salary, sm.created_at AS salary_row_created_at, e.created_at AS employee_created_at
FROM salary_monthly sm
JOIN employees e ON e.id = sm.employee_id
WHERE e.id IN (SELECT id FROM employees ORDER BY created_at DESC LIMIT 10)
  AND sm.month = '2026-06-01'
ORDER BY e.created_at DESC;
