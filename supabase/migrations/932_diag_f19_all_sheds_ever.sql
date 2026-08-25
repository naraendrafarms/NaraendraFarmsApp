-- Migration 932 (READ ONLY): every distinct shed Flock 19 has EVER used across
-- its whole life (rearing + laying) -- to explain why the Bulk Entry page
-- lists 13 sheds even during the laying phase.
SELECT 'f19_all_sheds_ever' AS chk, count(DISTINCT d.shed_id)::int AS n,
       string_agg(DISTINCT (fm.name || ' sh' || s.shed_no), ' | ') AS rows
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text = '19';
