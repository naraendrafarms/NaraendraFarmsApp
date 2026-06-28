-- Migration 197: diagnose why Feed Mill → Production tab shows empty even though
-- feed_production_log has rows (194 confirmed 2). The tab uses a PostgREST embed:
--   feed_production_log?select=*,feed_formulas(...),farms(...),feed_production_ingredients(*)
-- If ANY embed is ambiguous (more than one FK path) PostgREST returns 400 and the
-- app silently shows "No production records". Read-only.

-- A. ALL foreign keys leaving feed_production_log (look for duplicates per target)
SELECT 'A_fk_from_log' AS chk, tc.constraint_name, kcu.column_name AS fk_column,
       ccu.table_name AS references_table, ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name='feed_production_log'
ORDER BY references_table, tc.constraint_name;

-- B. ALL foreign keys INTO feed_formulas (a 2nd path = embed ambiguity on feed_formulas)
SELECT 'B_fk_into_feed_formulas' AS chk, tc.table_name AS from_table, tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
  AND ccu.table_name='feed_formulas' AND tc.table_name='feed_production_log'
ORDER BY tc.constraint_name;

-- C. Does the legacy table still exist (could confuse PostgREST relationships)?
SELECT 'C_legacy_exists' AS chk, COUNT(*) AS n
FROM information_schema.tables WHERE table_schema='public' AND table_name='feed_formulas_legacy';

-- D. ALL foreign keys INTO feed_production_log from feed_production_ingredients
SELECT 'D_fk_ingredients_to_log' AS chk, tc.constraint_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
  AND tc.table_name='feed_production_ingredients' AND ccu.table_name='feed_production_log'
ORDER BY tc.constraint_name;

-- E. Server-side simulation of the embed: do the rows join cleanly to formula + farm?
SELECT 'E_join_sim' AS chk, l.id, l.production_date, l.quantity_kg,
       f.formula_code, fa.code AS farm_code,
       (SELECT COUNT(*) FROM public.feed_production_ingredients pi WHERE pi.production_id=l.id) AS ing_count
FROM public.feed_production_log l
LEFT JOIN public.feed_formulas f ON f.id = l.formula_id
LEFT JOIN public.farms fa ON fa.id = l.farm_id
ORDER BY l.production_date DESC;
