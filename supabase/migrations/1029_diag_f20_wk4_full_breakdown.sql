SELECT string_agg(
  to_char(d.record_date,'MM-DD') || ' sh' || s.shed_no || ':' || d.mortality_female || '/' || d.mortality_male,
  ' | ' ORDER BY d.record_date, s.shed_no
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text = '20'
  AND d.record_date BETWEEN '2025-06-22' AND '2025-06-25'
  AND (d.mortality_female > 0 OR d.mortality_male > 0);

SELECT string_agg(
  to_char(d.record_date,'MM-DD') || ' sh' || s.shed_no || ':' || d.mortality_female || '/' || d.mortality_male,
  ' | ' ORDER BY d.record_date, s.shed_no
) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text = '20'
  AND d.record_date BETWEEN '2025-06-26' AND '2025-06-28'
  AND (d.mortality_female > 0 OR d.mortality_male > 0);
