SELECT string_agg(
  s.shed_no || ' ' || to_char(d.record_date,'MM-DD') ||
  ': open(' || d.opening_female || '/' || d.opening_male || ')' ||
  ' recd(' || d.received_female || '/' || d.received_male || ')' ||
  ' trin(' || d.transfer_in_female || '/' || d.transfer_in_male || ')' ||
  ' mort(' || d.mortality_female || '/' || d.mortality_male || ')' ||
  ' cull(' || d.cull_female || '/' || d.cull_male || ')' ||
  ' trcull(' || d.trcull_female || '/' || d.trcull_male || ')' ||
  ' transf(' || d.transfer_female || '/' || d.transfer_male || ')' ||
  ' close(' || d.closing_female || '/' || d.closing_male || ')',
  ' | ' ORDER BY s.shed_no::int, d.record_date
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND d.record_date IN ('2025-11-08','2025-11-09')
  AND fm.name = 'Bodjanampet - 1' AND s.shed_no IN ('4','5','6');
