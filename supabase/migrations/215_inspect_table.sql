-- Migration 215: read-only. Find why INSERT into feed_production_ingredients silently
-- fails (run_sql swallows duplicate/does-not-exist/already-exists errors).

SELECT 'idx' AS chk, indexname, indexdef
FROM pg_indexes WHERE schemaname='public' AND tablename='feed_production_ingredients';

SELECT 'cols' AS chk, column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='feed_production_ingredients'
ORDER BY ordinal_position;

SELECT 'constraints' AS chk, conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.feed_production_ingredients'::regclass;

-- duplicate ingredient names within a formula (would break a unique(production_id,ingredient_name))
SELECT 'dup_formula_names' AS chk, formula_id, ingredient_name, COUNT(*) AS n
FROM public.feed_formula_ingredients
GROUP BY formula_id, ingredient_name HAVING COUNT(*) > 1
LIMIT 5;
