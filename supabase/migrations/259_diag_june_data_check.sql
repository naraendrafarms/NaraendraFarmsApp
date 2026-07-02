-- Diagnostic only (SELECT), no data changes. Checking whether June 2026
-- attendance/salary data entered AFTER the earlier fake-Present cleanup
-- (migrations 237/240) is actually present in the DB or genuinely missing.
SELECT 'attendance_daily_june' AS chk, count(*) AS n
FROM public.attendance_daily WHERE attendance_date BETWEEN '2026-06-01' AND '2026-06-30';

SELECT 'salary_monthly_june' AS chk, count(*) AS n
FROM public.salary_monthly WHERE month = '2026-06-01';

SELECT 'employee_advances_june' AS chk, count(*) AS n
FROM public.employee_advances WHERE salary_month = '2026-06';

SELECT 'employee_deductions_june' AS chk, count(*) AS n
FROM public.employee_deductions WHERE deduction_month = '2026-06-01';

SELECT 'payslips_june' AS chk, count(*) AS n
FROM public.payslips WHERE month = '2026-06-01';
