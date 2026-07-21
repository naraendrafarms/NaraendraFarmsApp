-- Diagnostic only (no schema changes) — check actual status/ot_hours values
-- for the 3 employees whose Monthly Attendance Grid cells show blank despite
-- attendance_daily having 19 rows each for July 2026 (confirmed by 517).
SELECT ad.employee_id, e.emp_id, ad.attendance_date, ad.status, ad.ot_hours
FROM public.attendance_daily ad
JOIN public.employees e ON e.id = ad.employee_id
WHERE e.emp_id IN ('NF-BPET1-0008','NF-BPET1-0010','NF-BPET1-0018')
  AND ad.attendance_date >= '2026-07-01' AND ad.attendance_date <= '2026-07-31'
ORDER BY e.emp_id, ad.attendance_date
LIMIT 60;

-- Compare against a known-good employee in the same farm (Bhim Ganjan,
-- NF-BPET1-0006, confirmed showing correctly in the Grid screenshot) to see
-- if the status VALUES themselves differ in format/casing.
SELECT ad.employee_id, e.emp_id, ad.status, count(*) AS n
FROM public.attendance_daily ad
JOIN public.employees e ON e.id = ad.employee_id
WHERE e.emp_id = 'NF-BPET1-0006'
  AND ad.attendance_date >= '2026-07-01' AND ad.attendance_date <= '2026-07-31'
GROUP BY ad.employee_id, e.emp_id, ad.status;

SELECT 'sentinel' AS marker, 1 AS n;
