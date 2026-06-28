-- Migration 188: Re-backfill daily_records.farm_id from the flock's laying/rearing farm
-- (covers Flocks 19 & 20 now that a laying farm may be set), + show their current farm.

UPDATE public.daily_records dr
SET farm_id = COALESCE(f.laying_farm_id, f.rearing_farm_id)
FROM public.flocks f
WHERE dr.flock_id = f.id
  AND dr.farm_id IS NULL
  AND COALESCE(f.laying_farm_id, f.rearing_farm_id) IS NOT NULL;

-- Show flocks 19 & 20 current farm wiring
SELECT f.flock_no, f.breed,
       lf.name AS laying_farm, rf.name AS rearing_farm,
       (SELECT COUNT(*) FROM public.daily_records dr WHERE dr.flock_id = f.id AND dr.farm_id IS NULL) AS dr_null_farm
FROM public.flocks f
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
WHERE f.flock_no IN ('19','20')
ORDER BY f.flock_no;

-- Any remaining unknown-site records overall
SELECT 'daily_records_null_farm' AS check_name, COUNT(*) AS n
FROM public.daily_records WHERE farm_id IS NULL;
