SELECT string_agg(
  s.shed_no || ' ' || fm.name ||
  ': open(' || d.opening_female || ') recd(' || d.received_female || ') trin(' || d.transfer_in_female || ')' ||
  ' mort(' || d.mortality_female || ') cull(' || d.cull_female || ') trcull(' || d.trcull_female || ')' ||
  ' transf(' || d.transfer_female || ') close(' || d.closing_female || ')' ||
  ' diff(' || (d.opening_female + d.transfer_in_female + d.received_female - d.mortality_female - d.cull_female - d.transfer_female - d.closing_female) || ')',
  ' | '
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND d.record_date = '2025-11-11'
  AND (COALESCE(d.opening_female,0) + COALESCE(d.transfer_in_female,0) + COALESCE(d.received_female,0)
       - COALESCE(d.mortality_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0))
      <> COALESCE(d.closing_female,0);
