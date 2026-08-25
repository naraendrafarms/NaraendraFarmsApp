SELECT string_agg(
  'id=' || d.id || ' ' || to_char(d.record_date,'YYYY-MM-DD') ||
  ' open(' || COALESCE(d.opening_female::text,'NULL') || '/' || COALESCE(d.opening_male::text,'NULL') || ')' ||
  ' trcull(' || COALESCE(d.trcull_female::text,'NULL') || '/' || COALESCE(d.trcull_male::text,'NULL') || ')' ||
  ' mort(' || COALESCE(d.mortality_female::text,'NULL') || '/' || COALESCE(d.mortality_male::text,'NULL') || ')' ||
  ' transfer(' || COALESCE(d.transfer_female::text,'NULL') || '/' || COALESCE(d.transfer_male::text,'NULL') || ')' ||
  ' close(' || COALESCE(d.closing_female::text,'NULL') || '/' || COALESCE(d.closing_male::text,'NULL') || ')',
  ' | '
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '22'
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));
