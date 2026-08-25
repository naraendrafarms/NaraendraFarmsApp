SELECT string_agg(
  to_char(d.record_date,'YYYY-MM-DD') || ' sh' || s.shed_no ||
  ': mort(' || d.mortality_female || '/' || d.mortality_male || ')' ||
  ' cull(' || d.cull_female || '/' || d.cull_male || ')' ||
  ' trcull(' || d.trcull_female || '/' || d.trcull_male || ')',
  ' | ' ORDER BY d.record_date
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '20'
  AND d.record_date BETWEEN '2025-06-22' AND '2025-06-28'
  AND (d.mortality_female > 0 OR d.mortality_male > 0 OR d.cull_female > 0 OR d.cull_male > 0);
