-- Migration 204: read-only. Compare employee_deductions vs the 'other' employee_advances
-- so we know whether the ₹13,718.50 needs migrating into employee_deductions to be
-- deducted/shown in salary.

SELECT 'A_emp_deductions' AS chk, COUNT(*) AS rows,
  SUM(amount) AS total,
  COUNT(*) FILTER (WHERE status='pending') AS pending_rows,
  SUM(amount) FILTER (WHERE status='pending') AS pending_total
FROM public.employee_deductions;

SELECT 'B_emp_deductions_cols' AS chk, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='employee_deductions'
ORDER BY ordinal_position;

SELECT 'C_other_adv_by_month' AS chk, salary_month, COUNT(*) AS rows, SUM(amount) AS total
FROM public.employee_advances WHERE advance_type='other'
GROUP BY salary_month ORDER BY salary_month;
