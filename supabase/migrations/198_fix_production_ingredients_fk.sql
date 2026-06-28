-- Migration 198: Fix feed_production_ingredients.production_id FK.
-- Diagnostic 197 showed there is NO usable FK from feed_production_ingredients to the
-- CURRENT feed_production_log (it points at the old renamed/legacy table, same issue as
-- 185/193). So PostgREST cannot resolve the embed
--   feed_production_log?select=...,feed_production_ingredients(*)
-- and rejects the WHOLE query with 400 → the Production tab shows "No production records"
-- even though the rows exist. Repoint the FK to the current feed_production_log(id).

-- Drop whatever production_id FK currently exists (any name)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
      AND tc.table_name='feed_production_ingredients' AND kcu.column_name='production_id'
  LOOP
    EXECUTE format('ALTER TABLE public.feed_production_ingredients DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END $$;

-- Re-add it pointing at the current feed_production_log
ALTER TABLE public.feed_production_ingredients
  ADD CONSTRAINT feed_production_ingredients_production_id_fkey
  FOREIGN KEY (production_id) REFERENCES public.feed_production_log(id) ON DELETE CASCADE;

-- Verify: should now return exactly 1 row (the FK to feed_production_log)
SELECT 'fk_after' AS chk, tc.constraint_name, ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
  AND tc.table_name='feed_production_ingredients'
  AND tc.constraint_name='feed_production_ingredients_production_id_fkey';
