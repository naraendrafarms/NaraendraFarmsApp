-- Migration 918 (READ ONLY): exact list of dates with existing flock-level
-- (shed_id IS NULL) rows for Flock 20, chunked to see the full picture and
-- find every real gap (not just the one date range assumed).
DO $$
BEGIN
  EXECUTE 'DROP TABLE IF EXISTS public._f20fl';
  EXECUTE 'CREATE TABLE public._f20fl (rn serial PRIMARY KEY, d text)';
  INSERT INTO public._f20fl(d)
  SELECT to_char(d.record_date,'YYYY-MM-DD')
    FROM public.daily_records d
    JOIN public.flocks fl ON fl.id = d.flock_id
   WHERE fl.flock_no::text = '20' AND d.shed_id IS NULL
   ORDER BY d.record_date;
END $$;


SELECT 'f20fl_count' AS chk, count(*)::int AS n FROM public._f20fl;
SELECT 'f20fl_c1' AS chk, string_agg(d, ',' ORDER BY rn) AS rows FROM public._f20fl WHERE rn BETWEEN 1 AND 30;
SELECT 'f20fl_c2' AS chk, string_agg(d, ',' ORDER BY rn) AS rows FROM public._f20fl WHERE rn BETWEEN 31 AND 60;
SELECT 'f20fl_c3' AS chk, string_agg(d, ',' ORDER BY rn) AS rows FROM public._f20fl WHERE rn BETWEEN 61 AND 95;
