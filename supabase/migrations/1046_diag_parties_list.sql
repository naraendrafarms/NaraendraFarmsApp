SELECT string_agg(name, ' | ' ORDER BY name) FROM public.parties
WHERE name IN (
  'Hitech Hatch Fresh Private Limited','Jamal Agro Industries Private Limited',
  'Venkatadri Hatcheries','Akshaya Poultry and Hatchery','Ellandula Srinivas Kamareddy',
  'Raju Poultry Traders','Meghana Agencies'
);

SELECT id::text, flock_no::text, placement_date::text FROM public.flocks WHERE flock_no::text='19';
