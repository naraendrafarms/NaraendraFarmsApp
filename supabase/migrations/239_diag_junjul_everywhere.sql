-- Diagnostic only — find every place June/July 2026 data still exists across
-- employee-related tables, now that attendance_daily has been cleared for both.
SELECT
  (SELECT count(*) FROM public.salary_monthly WHERE month IN ('2026-06-01','2026-07-01')) AS salary_monthly_rows,
  (SELECT count(*) FROM public.salary_monthly WHERE month='2026-06-01' AND days_worked IS NOT NULL) AS jun_days_worked,
  (SELECT count(*) FROM public.salary_monthly WHERE month='2026-06-01' AND absent_days > 0) AS jun_absent_gt0,
  (SELECT count(*) FROM public.salary_monthly WHERE month='2026-07-01' AND days_worked IS NOT NULL) AS jul_days_worked,
  (SELECT count(*) FROM public.employee_advances WHERE salary_month IN ('2026-06','2026-07')) AS advances_rows,
  (SELECT count(*) FROM public.employee_deductions WHERE deduction_month IN ('2026-06-01','2026-07-01')) AS deductions_rows,
  (SELECT count(*) FROM public.payslips WHERE month IN ('2026-06-01','2026-07-01')) AS payslip_rows,
  (SELECT count(*) FROM public.attendance_daily WHERE attendance_date >= '2026-06-01' AND attendance_date <= '2026-07-31') AS attendance_daily_rows;
