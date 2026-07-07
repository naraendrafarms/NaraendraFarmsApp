SELECT 'sentinel' AS marker, 1 AS n;

SELECT f.id, f.name, f.code FROM farms f WHERE f.code ILIKE '%PPALLY%' OR f.name ILIKE '%Potlapally%' OR f.name ILIKE '%Agraharam%';

SELECT sm.month, count(*) AS emp_count, sum(sm.earned_salary) AS total_earned
FROM salary_monthly sm
JOIN employees e ON e.id = sm.employee_id
JOIN farms f ON f.id = e.farm_id
WHERE f.code ILIKE '%PPALLY%' OR f.name ILIKE '%Potlapally%'
GROUP BY sm.month
ORDER BY sm.month DESC
LIMIT 6;
