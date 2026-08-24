-- Migration 864 (READ ONLY): does Flock 20 have ANY daily_records rows at
-- Bodjanampet - 2 (VHL), or at any other laying-type shed anywhere, beyond
-- the 7 Bodjanampet-1 sheds already found?
SELECT 'f20_all_sheds_with_data' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT DISTINCT (fm.name || ' sh' || s.shed_no || ' (' || s.shed_type || ')') AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text = '20'
  ) x;

SELECT 'f20_bj2_rows' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text = '20' AND fm.name = 'Bodjanampet - 2 (VHL)';
