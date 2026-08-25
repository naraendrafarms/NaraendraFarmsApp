SELECT fm.name AS farm, count(*) AS total_sheds,
  string_agg(s.shed_no, ',' ORDER BY s.shed_no::int) AS shed_nos
FROM public.sheds s
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name IN ('Kethireddypally', 'Agraharam Potlapally')
GROUP BY fm.name;
