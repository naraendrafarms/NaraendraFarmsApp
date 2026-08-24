-- Migration 888 (READ ONLY): exact dates present for Kethireddypally shed 2
-- under the Flock 20 tag, chunked to fit the preview cap.
DO $$
BEGIN
  EXECUTE 'DROP TABLE IF EXISTS public._exp20sh2';
  EXECUTE 'CREATE TABLE public._exp20sh2 (rn serial PRIMARY KEY, d text)';
END $$;

INSERT INTO public._exp20sh2(d)
SELECT to_char(d.record_date,'YYYY-MM-DD')
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE d.remarks = 'F20_IMPORT_2026-08-24' AND fm.name='Kethireddypally' AND s.shed_no='2'
 ORDER BY d.record_date;

SELECT 'sh2_chunk1' AS chk, string_agg(dd, ',' ORDER BY rn) AS rows FROM (SELECT * FROM public._exp20sh2 WHERE rn BETWEEN 1 AND 45) t(rn,dd);
SELECT 'sh2_chunk2' AS chk, string_agg(dd, ',' ORDER BY rn) AS rows FROM (SELECT * FROM public._exp20sh2 WHERE rn BETWEEN 46 AND 90) t(rn,dd);
SELECT 'sh2_chunk3' AS chk, string_agg(dd, ',' ORDER BY rn) AS rows FROM (SELECT * FROM public._exp20sh2 WHERE rn BETWEEN 91 AND 121) t(rn,dd);
