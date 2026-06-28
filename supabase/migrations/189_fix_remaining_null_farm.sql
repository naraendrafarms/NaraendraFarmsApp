-- Migration 189: Inspect & force-fix the 6 daily_records still missing farm_id (flocks 19 & 20)

-- Show the offending rows (why weren't they backfilled?)
SELECT dr.id, f.flock_no, dr.shed_id, dr.record_date, dr.farm_id,
       f.laying_farm_id, f.rearing_farm_id
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
WHERE dr.farm_id IS NULL
ORDER BY f.flock_no, dr.record_date;

-- Force-fix: set farm_id from the flock's laying (else rearing) farm
UPDATE public.daily_records dr
SET farm_id = COALESCE(f.laying_farm_id, f.rearing_farm_id)
FROM public.flocks f
WHERE dr.flock_id = f.id
  AND dr.farm_id IS NULL
  AND COALESCE(f.laying_farm_id, f.rearing_farm_id) IS NOT NULL;

-- Also catch any daily_records whose flock_id is NULL but have a shed → use the shed's farm
UPDATE public.daily_records dr
SET farm_id = s.farm_id
FROM public.sheds s
WHERE dr.farm_id IS NULL AND dr.shed_id = s.id AND s.farm_id IS NOT NULL;

-- Final verify
SELECT 'remaining_null_farm' AS check_name, COUNT(*) AS n
FROM public.daily_records WHERE farm_id IS NULL;
