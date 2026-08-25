-- Audit 956 (READ ONLY): daily_records.farm_id disagrees with the shed's own farm_id.
SELECT 'farm_mismatch' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' shed=' || s.shed_no
         || ' rowfarm=' || COALESCE(fr.name,'NULL') || ' shedfarm=' || COALESCE(fs.name,'NULL')
         || ' n=' || COUNT(*) || ' first=' || MIN(d.record_date) || ' last=' || MAX(d.record_date) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  LEFT JOIN public.farms fs ON fs.id = s.farm_id
  LEFT JOIN public.farms fr ON fr.id = d.farm_id
  WHERE d.farm_id IS DISTINCT FROM s.farm_id
  GROUP BY f.flock_no, s.shed_no, fr.name, fs.name
) t;
