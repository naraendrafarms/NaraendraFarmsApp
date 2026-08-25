-- Migration 929 (READ ONLY): full site-wise verification of Flock 19 after
-- the cross-flock cascade corruption and fix this session.
SELECT 'f19_keth_shed_summary' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ': ' || min(d.record_date)::text || '..' || max(d.record_date)::text ||
            ' n=' || count(*) || ' first_open=' || (array_agg(d.opening_female ORDER BY d.record_date))[1] ||
            ' last_close=' || (array_agg(d.closing_female ORDER BY d.record_date DESC))[1]) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text = '19' AND fm.name = 'Kethireddypally'
     GROUP BY s.shed_no
  ) x;

SELECT 'f19_ap_shed_summary' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ': ' || min(d.record_date)::text || '..' || max(d.record_date)::text ||
            ' n=' || count(*) || ' first_open=' || (array_agg(d.opening_female ORDER BY d.record_date))[1] ||
            ' last_close=' || (array_agg(d.closing_female ORDER BY d.record_date DESC))[1]) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text = '19' AND fm.name ILIKE '%Agraharam%'
     GROUP BY s.shed_no
  ) x;

SELECT 'f19_formula_mismatches' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text = '19'
   AND (d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0)+COALESCE(d.transfer_in_female,0)+COALESCE(d.received_female,0)
          -COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))
     OR d.closing_male <> GREATEST(0, COALESCE(d.opening_male,0)+COALESCE(d.transfer_in_male,0)+COALESCE(d.received_male,0)
          -COALESCE(d.mortality_male,0)-COALESCE(d.cull_male,0)-COALESCE(d.trcull_male,0)-COALESCE(d.transfer_male,0)));
