-- Diagnostic only (no schema changes).
--
-- The staff panel is wanted site-wise AND flock-wise. attendance_daily has a
-- farm_id (site) but no flock_id, so flock-wise can only come from the site a
-- flock sits on. Before building anything, establish:
--   a) is attendance_daily.farm_id actually populated, or mostly NULL?
--   b) does employees.farm_id fill the gap where it is NULL?
--   c) how many flocks share a site — because if two flocks are on one site,
--      that site's staff CANNOT be split between them and a flock-wise figure
--      would be a fabrication.

-- 1. How complete is the site link on attendance, and on the employee.
SELECT COUNT(*) AS rows,
       COUNT(a.farm_id) AS with_attendance_farm,
       COUNT(e.farm_id) AS with_employee_farm,
       COUNT(COALESCE(a.farm_id, e.farm_id)) AS with_either
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
WHERE a.attendance_date BETWEEN '2026-07-01' AND '2026-07-31';

-- 2. Working days per SITE for July, using attendance farm then employee farm.
SELECT COALESCE(string_agg(site || '=' || days, ', ' ORDER BY site), 'NONE') AS site_working_days
FROM (
  SELECT COALESCE(f.name, '(no site)') AS site,
         SUM(CASE a.status WHEN 'P' THEN 1 WHEN 'OT' THEN 1 WHEN 'H' THEN 0.5 ELSE 0 END) AS days
  FROM public.attendance_daily a
  JOIN public.employees e ON e.id = a.employee_id
  LEFT JOIN public.farms f ON f.id = COALESCE(a.farm_id, e.farm_id)
  WHERE a.attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
  GROUP BY COALESCE(f.name, '(no site)')
) s;

-- 3. Flocks per site — the deciding question. More than one active flock on a
--    site means staff days cannot honestly be attributed to a single flock.
SELECT COALESCE(string_agg(site || ': ' || flocks, ' | ' ORDER BY site), 'NONE') AS flocks_per_site
FROM (
  SELECT COALESCE(f.name, '(no site)') AS site,
         string_agg(fl.flock_no, ',' ORDER BY fl.flock_no) AS flocks
  FROM public.flocks fl
  LEFT JOIN public.farms f ON f.id = COALESCE(fl.laying_farm_id, fl.rearing_farm_id)
  WHERE fl.status <> 'closed'
  GROUP BY COALESCE(f.name, '(no site)')
) x;

-- 4. Designation x site, so the shape of a site-wise panel is visible.
SELECT COALESCE(f.name, '(no site)') AS site, e.designation,
       COUNT(DISTINCT a.employee_id) AS employees,
       SUM(CASE a.status WHEN 'P' THEN 1 WHEN 'OT' THEN 1 WHEN 'H' THEN 0.5 ELSE 0 END) AS working_days
FROM public.attendance_daily a
JOIN public.employees e ON e.id = a.employee_id
LEFT JOIN public.farms f ON f.id = COALESCE(a.farm_id, e.farm_id)
WHERE a.attendance_date BETWEEN '2026-07-01' AND '2026-07-31'
GROUP BY COALESCE(f.name, '(no site)'), e.designation
ORDER BY working_days DESC
LIMIT 10;
