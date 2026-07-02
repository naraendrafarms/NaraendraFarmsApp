-- Requested by user: clear June & July 2026 salary_monthly rows entirely.
-- July had days_worked populated for 207 employees despite attendance_daily
-- having zero real July records (an unintended default from an earlier Bulk
-- Salary run) -- and June's payroll needs to be regenerated from the
-- freshly-cleared attendance_daily anyway. This is payroll data, read by
-- Salary Register, ESI/PF Report, PT, Statutory Compliance, Payroll Summary,
-- Attendance Register and Payslip Generator -- all six will go back to
-- showing nothing for June/July until Bulk Salary is re-run.
-- employee_deductions (85 rows, real flock egg/bird sale deductions owed by
-- employees) is left untouched -- not attendance/payroll-derived, still valid.
DELETE FROM public.salary_monthly
WHERE month IN ('2026-06-01', '2026-07-01');

-- Diagnostic: confirm both months are now empty
SELECT count(*) AS remaining_rows
FROM public.salary_monthly
WHERE month IN ('2026-06-01', '2026-07-01');
