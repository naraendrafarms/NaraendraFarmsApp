-- Migration 193: Fix feed_production_log.formula_id FK (same legacy-table issue as 185).
-- It references the old feed_formulas_legacy table, so saving a production log with a
-- current feed_formulas id fails. Repoint the FK to feed_formulas(id).

-- Show what it references now (diagnostic)
SELECT 'fk_before' AS chk, tc.constraint_name, ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name='feed_production_log'
  AND tc.constraint_name LIKE '%formula_id%';

ALTER TABLE public.feed_production_log
  DROP CONSTRAINT IF EXISTS feed_production_log_formula_id_fkey;

ALTER TABLE public.feed_production_log
  ADD CONSTRAINT feed_production_log_formula_id_fkey
  FOREIGN KEY (formula_id) REFERENCES public.feed_formulas(id) ON DELETE SET NULL;

-- Verify
SELECT 'fk_after' AS chk, ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name='feed_production_log'
  AND tc.constraint_name='feed_production_log_formula_id_fkey';
