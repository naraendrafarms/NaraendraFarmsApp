-- Migration 182: Fix "Unknown Site" in Shed Performance.
-- Cause: some daily_records (esp. flock-level HE grade rows, shed_id NULL) have farm_id NULL,
-- so they group under "Unknown Site". Backfill farm_id from the flock's laying/rearing farm.

-- Diagnostic: which flocks have no farm at all (these can't be auto-fixed)
SELECT 'flocks_without_farm' AS check_name, COUNT(*) AS n
FROM public.flocks
WHERE laying_farm_id IS NULL AND rearing_farm_id IS NULL;

-- Diagnostic: daily_records with NULL farm_id before fix
SELECT 'daily_records_null_farm_before' AS check_name, COUNT(*) AS n
FROM public.daily_records WHERE farm_id IS NULL;

-- Backfill farm_id from the flock (prefer laying farm, else rearing farm)
UPDATE public.daily_records dr
SET farm_id = COALESCE(f.laying_farm_id, f.rearing_farm_id)
FROM public.flocks f
WHERE dr.flock_id = f.id
  AND dr.farm_id IS NULL
  AND COALESCE(f.laying_farm_id, f.rearing_farm_id) IS NOT NULL;

-- Diagnostic: remaining NULL farm_id after fix (flocks genuinely without a farm)
SELECT 'daily_records_null_farm_after' AS check_name, COUNT(*) AS n
FROM public.daily_records WHERE farm_id IS NULL;

-- Show which flocks still have NULL-farm daily records (so user can assign a site)
SELECT DISTINCT f.flock_no, f.breed
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
WHERE dr.farm_id IS NULL
ORDER BY f.flock_no;
