-- Exactly what v_flock_summary sums for Flock 20: every row on its MAX(record_date).
SELECT string_agg(fm.name || '/Sh' || s.shed_no || '=' || COALESCE(d.closing_female,0)::text
       || '/' || COALESCE(d.closing_male,0)::text, ' | ' ORDER BY fm.name, (s.shed_no)::int) AS rows_on_max_date
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND d.record_date = (SELECT max(record_date) FROM public.daily_records
                       WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0');

SELECT max(record_date)::text AS max_date,
       sum(COALESCE(closing_female,0))::int AS summary_close_f,
       sum(COALESCE(closing_male,0))::int AS summary_close_m
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND record_date = (SELECT max(record_date) FROM public.daily_records
                     WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0');

-- Flock 20 rows on 2026-08-25 that sit in sheds it vacated (non Bodjanampet-1)
SELECT count(*)::int AS n_phantom_rows,
       sum(COALESCE(closing_female,0))::int AS phantom_f,
       sum(COALESCE(closing_male,0))::int AS phantom_m
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND d.record_date >= '2026-01-01'
  AND fm.name <> 'Bodjanampet - 1';
