-- Verify migration 1098. Read-only.
SELECT max(record_date)::text AS f20_max_date,
       sum(COALESCE(closing_female,0))::int AS f20_close_f,
       sum(COALESCE(closing_male,0))::int AS f20_close_m
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND record_date = (SELECT max(record_date) FROM public.daily_records
                     WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0');

SELECT string_agg(tgname || ':' || CASE WHEN tgenabled='D' THEN 'DISABLED' ELSE 'enabled' END, ' | ' ORDER BY tgname) AS trigger_state
FROM pg_trigger WHERE tgrelid = 'public.daily_records'::regclass
  AND tgname IN ('trg_chain_cascade','trg_chain_daily_opening');

SELECT string_agg(fm.name || '/Sh' || s.shed_no || '=' || COALESCE(d.closing_female,0)::text
       || '/' || COALESCE(d.closing_male,0)::text, ' | ' ORDER BY fm.name, (s.shed_no)::int) AS f22_after
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE f.flock_no::text = '22'
  AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                       JOIN public.flocks f2 ON f2.id = d2.flock_id WHERE f2.flock_no::text='22');

SELECT count(*)::int AS f20_bodjanampet_rows_total,
       (SELECT count(*)::int FROM public.daily_records d2 JOIN public.sheds s2 ON s2.id=d2.shed_id
        JOIN public.farms fm2 ON fm2.id=s2.farm_id
        WHERE d2.flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm2.name<>'Bodjanampet - 1'
          AND d2.record_date >= '2026-01-01') AS f20_phantoms_remaining,
       (SELECT count(*)::int FROM public.flock_sheds fs JOIN public.sheds s3 ON s3.id=fs.shed_id
        JOIN public.farms fm3 ON fm3.id=s3.farm_id
        WHERE fs.flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0') AS f20_links_left
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id='63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name='Bodjanampet - 1';
