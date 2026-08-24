-- Migration 867 (READ ONLY): real farm_id for Kethireddypally and Bodjanampet-1,
-- and check whether daily_records.farm_id is NOT NULL (required for the Flock 20 import).
SELECT 'farm_ids' AS chk, string_agg((name || '=' || id::text), ' | ') AS rows
  FROM public.farms WHERE name IN ('Kethireddypally','Bodjanampet - 1');

SELECT 'farm_id_nullable' AS chk, is_nullable
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='daily_records' AND column_name='farm_id';
