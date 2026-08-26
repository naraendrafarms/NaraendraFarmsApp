-- Flock 22 current state + whether its Kpally Sh2 rows look intact
SELECT string_agg(fm.name || '/Sh' || s.shed_no || '=' || COALESCE(d.closing_female,0)::text
       || '/' || COALESCE(d.closing_male,0)::text, ' | ' ORDER BY fm.name, (s.shed_no)::int) AS f22_rows_on_max_date
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE f.flock_no::text = '22'
  AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                       JOIN public.flocks f2 ON f2.id = d2.flock_id WHERE f2.flock_no::text='22');

SELECT count(*)::int AS f22_formula_violations
FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '22'
  AND d.closing_female IS NOT NULL AND d.opening_female IS NOT NULL
  AND d.closing_female <> (COALESCE(d.opening_female,0) + COALESCE(d.received_female,0)
        - COALESCE(d.mortality_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0));

-- the 5 Flock 20 phantom rows proposed for deletion
SELECT string_agg(fm.name || '/Sh' || s.shed_no || ' @' || d.record_date::text
       || ' close=' || COALESCE(d.closing_female,0)::text || '/' || COALESCE(d.closing_male,0)::text
       || ' feed=' || COALESCE(d.feed_female_kg,0)::text
       || ' eggs=' || COALESCE(d.total_eggs,0)::text, ' | ') AS f20_phantom_detail
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND d.record_date >= '2026-01-01' AND fm.name <> 'Bodjanampet - 1';
