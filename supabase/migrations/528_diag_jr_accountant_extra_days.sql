-- Diagnostic only (no schema changes) — user added a new designation
-- "Jr. Accountant" and says extra days are being applied automatically,
-- even though Extra Days per Designation (designation_extra_days table)
-- is meant to be an explicit opt-in per designation with no auto-seeding
-- (confirmed via code read — AdminCentre.tsx's editor is plain manual
-- CRUD, no defaults). Checking whether a row already exists matching it.
SELECT id, designation, extra_days_ge15, extra_days_lt15
FROM public.designation_extra_days
ORDER BY designation;

-- The employee(s) actually saved with this designation, exact spelling
SELECT id, emp_id, name, designation FROM public.employees
WHERE designation ILIKE '%accountant%';

SELECT 'sentinel' AS marker, 1 AS n;
