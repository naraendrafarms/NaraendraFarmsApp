-- User: VHL is identified by the SITE/FARM, not hatchery or party — the
-- site "Bodjanampet - 2 (VHL)". Confirm Flock 20's laying_farm_id points to
-- this farm, and find its exact name/id so the fix can match on farm.
SELECT f.flock_no, f.laying_farm_id, fm.name AS farm_name, fm.code AS farm_code
FROM public.flocks f
LEFT JOIN public.farms fm ON fm.id = f.laying_farm_id
WHERE f.flock_no = '20';

SELECT id, name, code FROM public.farms WHERE name ILIKE '%VHL%' OR name ILIKE '%Bodjanampet%';
