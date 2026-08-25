SELECT string_agg(
  'id=' || d.id || ' F' || fl.flock_no || ' sh' || s.shed_no || ' ' || to_char(d.record_date,'YYYY-MM-DD') ||
  ': open(' || d.opening_female || '/' || d.opening_male || ')' ||
  ' trcull(' || d.trcull_female || '/' || d.trcull_male || ')' ||
  ' mort(' || d.mortality_female || '/' || d.mortality_male || ')' ||
  ' close(' || d.closing_female || '/' || d.closing_male || ')',
  ' | ' ORDER BY fl.flock_no, s.shed_no::int, d.record_date
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text IN ('19','22')
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));
