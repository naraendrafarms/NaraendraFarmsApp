SELECT id::text, name FROM public.farms WHERE name ILIKE '%Kethireddypally%';

SELECT s.id::text, s.shed_no, s.shed_name, s.farm_id::text
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
WHERE f.name ILIKE '%Kethireddypally%' AND s.shed_no = '2';

SELECT ft.id::text, ft.flock_id::text, ft.to_shed_id::text, ft.transfer_date::text, ft.female_count, ft.male_count
FROM public.flock_transfers ft
WHERE ft.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
ORDER BY ft.transfer_date DESC
LIMIT 10;
