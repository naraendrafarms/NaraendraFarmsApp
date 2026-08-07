-- Diagnostic only (no schema changes).
--
-- The Monthly Production Review reports "Helper = 4696" working days for a
-- month, which the user says is wrong. Rather than reasoning about it, measure
-- what attendance_daily actually contains for Jul-2026: how many rows, which
-- status values are really present (not the ones the CHECK constraint claims),
-- whether any employee has more rows than there are days, and what the
-- per-designation totals come to.

-- 1. What status values actually exist, and how many of each.
SELECT COALESCE(string_agg(status || '=' || n, ', ' ORDER BY status), 'NO ROWS') AS status_counts
FROM (
  SELECT status, COUNT(*) AS n
  FROM public.attendance_daily
  WHERE attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
  GROUP BY status
) s;

-- 2. Scale check: rows, distinct employees, distinct days. If rows is far more
--    than employees x days, something is duplicated despite the unique index.
SELECT COUNT(*) AS rows,
       COUNT(DISTINCT employee_id) AS employees,
       COUNT(DISTINCT attendance_date) AS days,
       COUNT(DISTINCT employee_id) * COUNT(DISTINCT attendance_date) AS max_possible
FROM public.attendance_daily
WHERE attendance_date BETWEEN '2026-07-01' AND '2026-07-31';

-- 3. The Helper figure itself, broken down by status — this shows whether 4696
--    is a genuine total or is counting statuses it should not.
SELECT e.designation,
       COUNT(*) AS all_rows,
       COUNT(*) FILTER (WHERE a.status = 'P')  AS p,
       COUNT(*) FILTER (WHERE a.status = 'OT') AS ot,
       COUNT(*) FILTER (WHERE a.status = 'H')  AS h,
       COUNT(*) FILTER (WHERE a.status = 'A')  AS a_absent,
       COUNT(*) FILTER (WHERE a.status = 'WO') AS wo,
       COUNT(DISTINCT a.employee_id) AS employees
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
WHERE a.attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
GROUP BY e.designation
ORDER BY all_rows DESC
LIMIT 12;

-- 4. Does any employee have more than one row on a day (would inflate totals)?
SELECT COUNT(*) AS employee_days_with_duplicates
FROM (
  SELECT employee_id, attendance_date
  FROM public.attendance_daily
  WHERE attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
  GROUP BY employee_id, attendance_date
  HAVING COUNT(*) > 1
) d;

-- 5. Are inactive / left employees still carrying attendance in the month?
SELECT COUNT(*) AS rows_for_inactive_employees
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
WHERE a.attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
  AND (e.is_active = FALSE OR (e.leaving_date IS NOT NULL AND e.leaving_date < '2026-07-01'));
