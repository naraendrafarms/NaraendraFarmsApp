-- Diagnostic only (no schema changes) — checking why specific active
-- employees show blank in Monthly Attendance Grid for July 2026 while
-- Attendance Register shows their data correctly. Hypothesis: duplicate
-- employees rows with the same emp_id but different id (UUID), so the
-- Grid's employees query returns a different id than what attendance_daily
-- actually references for these people.
SELECT emp_id, count(*) AS n, string_agg(id::text, ' | ') AS ids,
  string_agg(is_active::text, ' | ') AS actives,
  string_agg(coalesce(farm_id::text,'null'), ' | ') AS farm_ids
FROM public.employees
WHERE emp_id IN ('NF-BPET1-0008','NF-BPET1-0010','NF-BPET1-0018')
GROUP BY emp_id;

SELECT e.emp_id, e.id AS employees_id, e.is_active, e.farm_id,
  (SELECT count(*) FROM public.attendance_daily ad WHERE ad.employee_id = e.id
     AND ad.attendance_date >= '2026-07-01' AND ad.attendance_date <= '2026-07-31') AS att_rows_july,
  (SELECT count(*) FROM public.salary_monthly sm WHERE sm.employee_id = e.id AND sm.month = '2026-07-01') AS salary_rows_july
FROM public.employees e
WHERE e.emp_id IN ('NF-BPET1-0008','NF-BPET1-0010','NF-BPET1-0018');

-- Which employee_id does attendance_daily actually reference for these
-- people in July 2026, independent of the employees table's current id?
SELECT DISTINCT ad.employee_id, count(*) AS n_rows
FROM public.attendance_daily ad
WHERE ad.employee_id IN (
  SELECT id FROM public.employees WHERE emp_id IN ('NF-BPET1-0008','NF-BPET1-0010','NF-BPET1-0018')
)
AND ad.attendance_date >= '2026-07-01' AND ad.attendance_date <= '2026-07-31'
GROUP BY ad.employee_id;

SELECT 'sentinel' AS marker, 1 AS n;
