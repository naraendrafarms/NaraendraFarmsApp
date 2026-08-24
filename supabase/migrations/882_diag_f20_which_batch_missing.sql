-- Migration 882 (READ ONLY): which shed/date-range is still short after the redo,
-- and what are the 15 formula mismatches.
SELECT 'f20_by_shed_after_redo' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ':' || count(*)) AS t
      FROM public.daily_records d
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
     GROUP BY s.shed_no, fm.name
  ) x;

SELECT 'f20_mismatch_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ' ' || d.record_date::text ||
            ' of=' || d.opening_female || ' tif=' || d.transfer_in_female || ' rf=' || d.received_female ||
            ' mf=' || d.mortality_female || ' cf=' || d.cull_female || ' trcf=' || d.trcull_female ||
            ' tf=' || d.transfer_female || ' cl=' || d.closing_female) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text = '20'
       AND (d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0)+COALESCE(d.transfer_in_female,0)+COALESCE(d.received_female,0)
              -COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0)))
     LIMIT 5
  ) x;
