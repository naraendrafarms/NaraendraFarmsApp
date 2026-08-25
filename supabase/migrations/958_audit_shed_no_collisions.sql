-- Audit 958 (READ ONLY): flocks whose daily_records span sheds sharing a shed_no across farms.
SELECT 'shed_no_collision' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' shed_no=' || s.shed_no || ' farms=' || COUNT(DISTINCT s.farm_id) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  GROUP BY f.flock_no, s.shed_no
  HAVING COUNT(DISTINCT s.farm_id) > 1
) t;
