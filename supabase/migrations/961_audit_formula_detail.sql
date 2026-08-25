-- Audit 961 (READ ONLY): largest closing-vs-formula discrepancies, top 12 by size.
SELECT 'formula_detail' AS chk,
       COALESCE(string_agg(txt, ' | '), 'NONE') AS rows
FROM (
  SELECT f.flock_no || '/sh' || COALESCE(s.shed_no,'FL') || ' ' || d.record_date
         || ' cF=' || COALESCE(d.closing_female,0)
         || ' expF=' || (COALESCE(d.opening_female,0)+COALESCE(d.received_female,0)+COALESCE(d.transfer_in_female,0)-COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0)) AS txt,
         ABS(COALESCE(d.closing_female,0) - (COALESCE(d.opening_female,0)+COALESCE(d.received_female,0)+COALESCE(d.transfer_in_female,0)-COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))) AS diff
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  ORDER BY diff DESC
  LIMIT 12
) t;
