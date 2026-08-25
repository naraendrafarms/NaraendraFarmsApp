-- Audit 950 (READ ONLY): closing = opening + received + transfer_in - mortality - cull - trcull - transfer
SELECT 'formula_mismatch' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' shed=' || COALESCE(s.shed_no,'FLOCKLVL')
         || ' n=' || COUNT(*)
         || ' first=' || MIN(d.record_date)
         || ' last=' || MAX(d.record_date)
         || ' maxdiffF=' || MAX(ABS(COALESCE(d.closing_female,0) - (COALESCE(d.opening_female,0)+COALESCE(d.received_female,0)+COALESCE(d.transfer_in_female,0)-COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0)))) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  WHERE COALESCE(d.closing_female,0) <> (COALESCE(d.opening_female,0)+COALESCE(d.received_female,0)+COALESCE(d.transfer_in_female,0)-COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))
     OR COALESCE(d.closing_male,0) <> (COALESCE(d.opening_male,0)+COALESCE(d.received_male,0)+COALESCE(d.transfer_in_male,0)-COALESCE(d.mortality_male,0)-COALESCE(d.cull_male,0)-COALESCE(d.trcull_male,0)-COALESCE(d.transfer_male,0))
  GROUP BY f.flock_no, s.shed_no
) t;
