-- Diagnostic only (no schema changes) — user says searching "VVND" doesn't
-- find "Inactivated Pullet ND HPAI Vaccine (W)" even though they consider
-- "VVND Killed (HP) New Strain Hester" the same item. Checking whether
-- these are two separate items rows, and whether "VVND" is registered as
-- an alias anywhere at all.
SELECT id, name, code, category, manufacturer, is_active
FROM public.items
WHERE name ILIKE '%VVND%' OR name ILIKE '%Inactivated Pullet%' OR name ILIKE '%HPAI%';

SELECT ia.id, ia.item_id, ia.alias, ia.source, i.name AS item_name
FROM public.item_aliases ia
JOIN public.items i ON i.id = ia.item_id
WHERE ia.alias ILIKE '%VVND%' OR ia.alias ILIKE '%Inactivated Pullet%' OR ia.alias ILIKE '%HPAI%';

SELECT 'sentinel' AS marker, 1 AS n;
