-- Audit 960 (READ ONLY): remaining continuity breaks, sheds 7/8/9 only.
SELECT 'continuity_rest' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || '/sh' || s.shed_no || ' ' || d.record_date
         || ' dF=' || (COALESCE(d.opening_female,0)-COALESCE(d.pf,0))
         || ' dM=' || (COALESCE(d.opening_male,0)-COALESCE(d.pm,0)) AS txt
  FROM (
    SELECT dr.flock_id, dr.shed_id, dr.record_date, dr.opening_female, dr.opening_male,
           LAG(dr.closing_female) OVER (PARTITION BY dr.flock_id, dr.shed_id ORDER BY dr.record_date) AS pf,
           LAG(dr.closing_male)   OVER (PARTITION BY dr.flock_id, dr.shed_id ORDER BY dr.record_date) AS pm
    FROM public.daily_records dr
  ) d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  WHERE d.pf IS NOT NULL
    AND (COALESCE(d.opening_female,0) <> COALESCE(d.pf,0) OR COALESCE(d.opening_male,0) <> COALESCE(d.pm,0))
    AND s.shed_no IN ('7','8','9')
) t;
