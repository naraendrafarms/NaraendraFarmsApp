SELECT s.id::text, s.shed_no, s.shed_name, f.name AS farm_name
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
WHERE s.id IN (
  SELECT DISTINCT shed_id FROM public.daily_records
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id IS NOT NULL
)
ORDER BY f.name, s.shed_no;
