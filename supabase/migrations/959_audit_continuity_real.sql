-- Audit 959 (READ ONLY): continuity breaks EXCLUDING empty/refill (0-valued) shed-swap events.
SELECT 'continuity_real' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || '/sh' || COALESCE(s.shed_no,'FL') || ' ' || d.record_date
         || ' dF=' || (COALESCE(d.opening_female,0)-COALESCE(d.pf,0))
         || ' dM=' || (COALESCE(d.opening_male,0)-COALESCE(d.pm,0)) AS txt
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
    AND COALESCE(d.opening_female,0) > 0 AND COALESCE(d.pf,0) > 0
    AND COALESCE(d.opening_male,0) > 0 AND COALESCE(d.pm,0) > 0
) t;
