-- Audit 963 (READ ONLY): component dump for the biggest formula outliers.
SELECT 'formula_components' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || '/' || COALESCE(s.shed_no,'FL') || ' ' || d.record_date
         || ' oF=' || COALESCE(d.opening_female,0) || ' cF=' || COALESCE(d.closing_female,0)
         || ' rec=' || COALESCE(d.received_female,0) || ' tin=' || COALESCE(d.transfer_in_female,0)
         || ' mort=' || COALESCE(d.mortality_female,0) || ' cull=' || COALESCE(d.cull_female,0)
         || ' trc=' || COALESCE(d.trcull_female,0) || ' tout=' || COALESCE(d.transfer_female,0) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  WHERE (f.flock_no = '23' AND d.record_date = DATE '2026-08-17')
     OR (f.flock_no = '19' AND d.shed_id IS NULL AND d.record_date = DATE '2026-06-04')
     OR (f.flock_no = '22' AND d.shed_id IS NULL AND d.record_date = DATE '2026-05-16')
) t;
