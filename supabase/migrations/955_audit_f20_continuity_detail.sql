-- Audit 955 (READ ONLY): every continuity break, with dates and values.
SELECT 'continuity_detail' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' sh' || COALESCE(s.shed_no,'FL') || ' ' || d.record_date
         || ' oF=' || COALESCE(d.opening_female,0) || ' prevCF=' || COALESCE(d.pf,0)
         || ' oM=' || COALESCE(d.opening_male,0) || ' prevCM=' || COALESCE(d.pm,0) AS txt
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
) t;
