-- Audit 962 (READ ONLY): farm_id mismatch rolled up by flock + farm pair + date.
SELECT 'farm_mismatch_sum' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' ' || d.record_date || ' rows=' || COUNT(*)
         || ' rowfarm=' || COALESCE(fr.name,'NULL') || ' shedfarm=' || COALESCE(fs.name,'NULL') AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  LEFT JOIN public.farms fs ON fs.id = s.farm_id
  LEFT JOIN public.farms fr ON fr.id = d.farm_id
  WHERE d.farm_id IS DISTINCT FROM s.farm_id
  GROUP BY f.flock_no, d.record_date, fr.name, fs.name
) t;
