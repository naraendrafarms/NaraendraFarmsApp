-- Migration 858 (READ ONLY): real shed_no values for Bodjanampet-1 and Kethireddypally,
-- and confirm which sheds actually have Flock 20 daily_records rows.
SELECT 'f20_shed_no_real' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ':' || s.shed_no || ' id=' || s.id::text) AS t
      FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fm.name IN ('Bodjanampet - 1','Kethireddypally')
  ) x;

SELECT 'f20_shed_no_used' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT DISTINCT (fm.name || ':' || s.shed_no || ' n=' || count(*) OVER (PARTITION BY s.id)) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text = '20'
  ) x;
