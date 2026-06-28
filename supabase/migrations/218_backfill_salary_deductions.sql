-- Migration 218: backfill Other Deduction into already-generated salary rows. Rows
-- generated before the fix have other_deduction=0; set it from pending employee_deductions
-- for the same employee+month and adjust net (add back any old deduction, subtract new).

CREATE TABLE IF NOT EXISTS public.salary_monthly_dedbackup_218 AS
SELECT id, month, employee_id, other_deduction, net_salary FROM public.salary_monthly;

SELECT 'before' AS chk, COUNT(*) AS rows_with_ded,
  COALESCE(SUM(other_deduction),0) AS total_ded
FROM public.salary_monthly WHERE COALESCE(other_deduction,0) > 0;

UPDATE public.salary_monthly sm
SET other_deduction = d.total,
    net_salary = GREATEST(0, COALESCE(sm.net_salary,0) + COALESCE(sm.other_deduction,0) - d.total)
FROM (
  SELECT employee_id, deduction_month, SUM(amount) AS total
  FROM public.employee_deductions WHERE status='pending'
  GROUP BY employee_id, deduction_month
) d
WHERE sm.employee_id = d.employee_id
  AND sm.month = d.deduction_month
  AND COALESCE(sm.other_deduction,0) <> d.total;

SELECT 'after' AS chk, COUNT(*) AS rows_with_ded,
  COALESCE(SUM(other_deduction),0) AS total_ded
FROM public.salary_monthly WHERE COALESCE(other_deduction,0) > 0;
