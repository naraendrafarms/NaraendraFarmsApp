-- Migration 856 (READ ONLY / scratch): monthly per-shed export of Flock 20's
-- real app data (Bodjanampet-1 sheds 1-4 first half), chunked through a scratch
-- table so the full result set is visible in the job log despite run_sql.py's
-- 5-statement / 600-char preview cap.

DO $$
BEGIN
  EXECUTE 'DROP TABLE IF EXISTS public._exp20';
  EXECUTE 'CREATE TABLE public._exp20 (rn serial PRIMARY KEY, line text)';
END $$;

INSERT INTO public._exp20(line)
SELECT 'sh' || s.shed_no || ',' ||
       to_char(date_trunc('month', d.record_date), 'YY-MM') || ',' ||
       to_char(min(d.record_date),'MMDD') || '-' || to_char(max(d.record_date),'MMDD') || ',' ||
       (array_agg(d.opening_female ORDER BY d.record_date))[1] || ',' ||
       (array_agg(d.closing_female ORDER BY d.record_date DESC))[1] || ',' ||
       sum(COALESCE(d.mortality_female,0)+COALESCE(d.mortality_male,0)) || ',' ||
       sum(COALESCE(d.cull_female,0)+COALESCE(d.cull_male,0)) || ',' ||
       sum(COALESCE(d.transfer_in_female,0)+COALESCE(d.transfer_in_male,0)) || ',' ||
       sum(COALESCE(d.eggs_total,0))
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text = '20' AND fm.name = 'Bodjanampet - 1' AND s.shed_no IN ('1','2','3','4')
 GROUP BY s.shed_no, date_trunc('month', d.record_date)
 ORDER BY s.shed_no, date_trunc('month', d.record_date);

SELECT string_agg(line, ' ~ ' ORDER BY rn) AS chunk1 FROM public._exp20 WHERE rn BETWEEN 1 AND 12;
SELECT string_agg(line, ' ~ ' ORDER BY rn) AS chunk2 FROM public._exp20 WHERE rn BETWEEN 13 AND 24;
SELECT string_agg(line, ' ~ ' ORDER BY rn) AS chunk3 FROM public._exp20 WHERE rn BETWEEN 25 AND 36;
SELECT string_agg(line, ' ~ ' ORDER BY rn) AS chunk4 FROM public._exp20 WHERE rn BETWEEN 37 AND 48;
