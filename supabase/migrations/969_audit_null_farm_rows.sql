-- Audit 969 (READ ONLY): daily_records rows with farm_id IS NULL.
SELECT 'null_farm_rows' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' ' || d.record_date || ' shed=' || COALESCE(s.shed_no,'FL')
         || ' cF=' || COALESCE(d.closing_female,0) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  WHERE d.farm_id IS NULL
) t;
