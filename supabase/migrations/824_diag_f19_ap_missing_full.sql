-- Migration 824 (READ ONLY): compact list of just the 35 date+shed KEYS
-- missing from daily_records (the row data itself is already held locally
-- from the same source file used to build the staging table).
SELECT 'missing_keys' AS chk,
       string_agg(st.record_date::text || '-' || st.shed_no, ',' ORDER BY st.record_date, st.shed_no) AS keys
  FROM public.staging_f19_ap st
 WHERE NOT EXISTS (
   SELECT 1 FROM public.daily_records d
   JOIN public.flocks f ON f.id = d.flock_id
   JOIN public.sheds s ON s.id = d.shed_id
   JOIN public.farms fa ON fa.id = s.farm_id
  WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
    AND s.shed_no = st.shed_no AND d.record_date = st.record_date
 );
