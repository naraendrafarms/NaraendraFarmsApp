SELECT fm.name AS farm, s.shed_no,
  d.opening_female, d.opening_male,
  d.cull_female, d.cull_male, d.trcull_female, d.trcull_male,
  d.mortality_female, d.mortality_male,
  d.closing_female, d.closing_male
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND d.record_date = '2025-11-11'
  AND (fm.name = 'Bodjanampet - 1' OR (fm.name = 'Kethireddypally' AND s.shed_no = '2'))
ORDER BY fm.name, s.shed_no::int;
