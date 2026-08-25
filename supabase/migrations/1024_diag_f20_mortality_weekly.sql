SELECT placement_date::text AS placement, id::text AS flock_id FROM public.flocks WHERE flock_no::text='20';

SELECT string_agg(
  wk || ':' || sum_mf || '/' || sum_mm,
  ',' ORDER BY wk
) AS rows
FROM (
  SELECT (floor((d.record_date - fl.placement_date)/7) + 1)::int AS wk,
         sum(d.mortality_female) AS sum_mf, sum(d.mortality_male) AS sum_mm
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE fl.flock_no::text = '20'
  GROUP BY wk
) x
WHERE wk BETWEEN 1 AND 23;
