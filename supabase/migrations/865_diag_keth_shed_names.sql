-- Migration 865 (READ ONLY): real shed_name values for Kethireddypally, to map
-- the uploaded Flock 20 Excel's labels (B1-B5, G1-G7, Kpally-G2) to real shed_id.
SELECT 'keth_shed_names' AS chk,
       string_agg((s.shed_no || ':' || COALESCE(s.shed_name,'NULL') || ':' || s.shed_type), ' | ' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name = 'Kethireddypally';
