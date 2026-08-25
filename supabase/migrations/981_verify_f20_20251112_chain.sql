SELECT string_agg(
  fm.name || ' sh' || s.shed_no || ': open(' || d.opening_female || '/' || d.opening_male || ') close(' || d.closing_female || '/' || d.closing_male || ')',
  ' | ' ORDER BY fm.name, s.shed_no::int
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND d.record_date = '2025-11-12'
  AND (fm.name = 'Bodjanampet - 1' OR (fm.name = 'Kethireddypally' AND s.shed_no = '2'));
