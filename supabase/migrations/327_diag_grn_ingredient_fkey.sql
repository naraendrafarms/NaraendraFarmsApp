-- Investigate the "grn_ingredient_id_fkey" violation report. Find what
-- table/column ingredient_id references, and what the front-end is
-- actually supplying for that field.
SELECT
  tc.constraint_name, kcu.column_name AS fk_column,
  ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_name = 'grn_ingredient_id_fkey';

-- Tables that look like an ingredient/item master, to see which one is
-- the real target vs. what the code might be passing (e.g. items.id vs
-- a feed_ingredients-specific id)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND (table_name ILIKE '%ingredient%' OR table_name ILIKE '%item%')
ORDER BY table_name;
