SELECT string_agg(shed_no || ':' || shed_name || '=' || id::text, ', ') AS sheds
FROM public.sheds s
WHERE s.id IN (
  SELECT DISTINCT shed_id FROM public.daily_records
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id IS NOT NULL
)
AND s.farm_id IN (SELECT id FROM public.farms WHERE name ILIKE '%Kethireddypally%');
