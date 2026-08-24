-- Migration 863 (READ ONLY): real shed_type per shed, per farm/site, with site_type,
-- for Kethireddypally, Bodjanampet-1, Bodjanampet-2 (VHL).
SELECT 'site_types' AS chk, string_agg((name || ':' || COALESCE(site_type,'NULL')), ' | ' ORDER BY name) AS rows
  FROM public.farms
 WHERE name IN ('Kethireddypally','Bodjanampet - 1','Bodjanampet - 2 (VHL)');

SELECT 'shed_types_keth' AS chk, string_agg((s.shed_no || ':' || COALESCE(s.shed_type,'NULL')), ' | ' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name = 'Kethireddypally';

SELECT 'shed_types_bj1' AS chk, string_agg((s.shed_no || ':' || COALESCE(s.shed_type,'NULL')), ' | ' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name = 'Bodjanampet - 1';

SELECT 'shed_types_bj2' AS chk, string_agg((s.shed_no || ':' || COALESCE(s.shed_type,'NULL')), ' | ' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name = 'Bodjanampet - 2 (VHL)';
