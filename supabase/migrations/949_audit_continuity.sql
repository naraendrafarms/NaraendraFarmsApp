-- Audit 949 (READ ONLY): opening/closing continuity per flock+shed, all flocks.
SELECT 'continuity_mismatch' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' shed=' || COALESCE(s.shed_no,'FLOCKLVL')
         || ' n=' || COUNT(*)
         || ' first=' || MIN(d.record_date)
         || ' lastf=' || MAX(d.record_date) AS txt
  FROM (
    SELECT dr.flock_id, dr.shed_id, dr.record_date, dr.opening_female, dr.opening_male,
           LAG(dr.closing_female) OVER (PARTITION BY dr.flock_id, dr.shed_id ORDER BY dr.record_date) AS pf,
           LAG(dr.closing_male)   OVER (PARTITION BY dr.flock_id, dr.shed_id ORDER BY dr.record_date) AS pm
    FROM public.daily_records dr
  ) d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  WHERE d.pf IS NOT NULL
    AND (COALESCE(d.opening_female,0) <> COALESCE(d.pf,0) OR COALESCE(d.opening_male,0) <> COALESCE(d.pm,0))
  GROUP BY f.flock_no, s.shed_no
) t;
