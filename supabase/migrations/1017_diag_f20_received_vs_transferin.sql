SELECT string_agg(
  to_char(d.record_date,'YYYY-MM-DD') || ' sh' || s.shed_no ||
  ': open(' || d.opening_female || ') recd(' || d.received_female || ') trin(' || d.transfer_in_female || ')' ||
  ' mort(' || d.mortality_female || ') cull(' || d.cull_female || ') trcull(' || d.trcull_female || ')' ||
  ' transf(' || d.transfer_female || ') close(' || d.closing_female || ')',
  ' | ' ORDER BY d.record_date
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text = '20'
  AND d.record_date IN ('2025-09-25','2025-09-27','2025-09-28')
  AND (COALESCE(d.opening_female,0) + COALESCE(d.transfer_in_female,0)
       - COALESCE(d.mortality_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0))
      <> COALESCE(d.closing_female,0);
