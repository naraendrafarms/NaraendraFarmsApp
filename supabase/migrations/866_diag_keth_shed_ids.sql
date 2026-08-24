-- Migration 866 (READ ONLY): full Kethireddypally shed_id list (1-12), and
-- Bodjanampet-1 shed_id list (1-7), plus flock_id, for building the Flock 20 import.
SELECT 'keth_ids' AS chk, string_agg((s.shed_no || '=' || s.id::text), ' | ' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name = 'Kethireddypally';

SELECT 'bj1_ids' AS chk, string_agg((s.shed_no || '=' || s.id::text), ' | ' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name = 'Bodjanampet - 1';

SELECT 'f20_flock_id' AS chk, id::text AS flock_id FROM public.flocks WHERE flock_no::text='20';
