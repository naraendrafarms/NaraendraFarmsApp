SELECT string_agg(
  fm.name || ' sh' || s.shed_no || ': dup=' ||
  CASE WHEN d.trcull_female=d.transfer_female AND d.trcull_male=d.transfer_male THEN 'Y' ELSE 'N' END ||
  ' correct(' || (d.opening_female-d.trcull_female-d.mortality_female) || '/' || (d.opening_male-d.trcull_male-d.mortality_male) ||
  ') stored(' || d.closing_female || '/' || d.closing_male || ')',
  ' | ' ORDER BY fm.name, s.shed_no::int
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND d.record_date = '2025-11-11'
  AND (fm.name = 'Bodjanampet - 1' OR (fm.name = 'Kethireddypally' AND s.shed_no = '2'));
