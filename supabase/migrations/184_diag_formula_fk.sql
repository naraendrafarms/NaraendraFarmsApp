-- Migration 184: Diagnose the feed_formula_ingredients FK violation (read-only checks)

-- 1. What does the FK actually reference?
SELECT 'fk_definition' AS check_name,
  tc.constraint_name,
  kcu.column_name AS fk_column,
  ccu.table_name  AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'feed_formula_ingredients';

-- 2. BCM formula rows in feed_formulas (id + dupes?)
SELECT 'bcm_formulas' AS check_name, id, formula_code, formula_name, version
FROM public.feed_formulas WHERE UPPER(TRIM(formula_code)) = 'BCM';

-- 3. Total formulas + ingredients
SELECT 'counts' AS check_name,
  (SELECT COUNT(*) FROM public.feed_formulas) AS formulas,
  (SELECT COUNT(*) FROM public.feed_formula_ingredients) AS ingredients;

-- 4. Orphan ingredients (formula_id not in feed_formulas) — should be 0
SELECT 'orphan_ingredients' AS check_name, COUNT(*) AS n
FROM public.feed_formula_ingredients fi
LEFT JOIN public.feed_formulas f ON f.id = fi.formula_id
WHERE f.id IS NULL;
