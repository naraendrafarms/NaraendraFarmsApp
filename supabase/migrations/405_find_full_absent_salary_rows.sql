SELECT 'sentinel' AS marker, 1 AS n;

-- Employees who have a June 2026 salary_monthly row but ZERO 'P' (present) days
-- recorded in attendance_daily for June — i.e. fully absent, wrongly salaried
-- by Quick Generate (which never checked attendance at all).
SELECT sm.id AS salary_monthly_id, e.emp_id, e.name, sm.month, sm.earned_salary, sm.is_paid,
       COALESCE(att.present_days, 0) AS present_days,
       COALESCE(att.absent_days, 0) AS absent_days,
       COALESCE(att.total_att_rows, 0) AS attendance_rows_logged
FROM salary_monthly sm
JOIN employees e ON e.id = sm.employee_id
LEFT JOIN (
  SELECT employee_id,
         count(*) FILTER (WHERE status='P') AS present_days,
         count(*) FILTER (WHERE status='A') AS absent_days,
         count(*) AS total_att_rows
  FROM attendance_daily
  WHERE attendance_date >= '2026-06-01' AND attendance_date < '2026-07-01'
  GROUP BY employee_id
) att ON att.employee_id = sm.employee_id
WHERE sm.month = '2026-06-01'
  AND COALESCE(att.present_days,0) = 0
ORDER BY e.name;

-- Same check for July 2026
SELECT sm.id AS salary_monthly_id, e.emp_id, e.name, sm.month, sm.earned_salary, sm.is_paid,
       COALESCE(att.present_days, 0) AS present_days,
       COALESCE(att.absent_days, 0) AS absent_days,
       COALESCE(att.total_att_rows, 0) AS attendance_rows_logged
FROM salary_monthly sm
JOIN employees e ON e.id = sm.employee_id
LEFT JOIN (
  SELECT employee_id,
         count(*) FILTER (WHERE status='P') AS present_days,
         count(*) FILTER (WHERE status='A') AS absent_days,
         count(*) AS total_att_rows
  FROM attendance_daily
  WHERE attendance_date >= '2026-07-01' AND attendance_date < '2026-08-01'
  GROUP BY employee_id
) att ON att.employee_id = sm.employee_id
WHERE sm.month = '2026-07-01'
  AND COALESCE(att.present_days,0) = 0
ORDER BY e.name;
