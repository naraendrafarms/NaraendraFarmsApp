-- 617 reported "Errors: 0" but left prevexxion_rows_left = 1, and its
-- statements [1] and [5] printed NOTHING while [3] and [4] printed fine.
-- A statement that returns one row and prints nothing did not run. Combined
-- with run_sql.py treating any error containing "does not exist" as SUCCESS,
-- the likely cause is that 617 referenced a column that is not there —
-- feed_formula_ingredients.ingredient_id. The seed data in 028/029 inserts
-- only (formula_id, ingredient_code, ingredient_name, percentage, ...), which
-- fits: the link may be by CODE and NAME, with no id column at all.
--
-- If so, statement 2 of 617 (the DELETE) failed the same way and silently did
-- nothing — which is exactly what the leftover row shows. Establish the real
-- columns before writing the delete a second time.

-- 1. The actual columns of the formula and production ingredient tables.
SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, ordinal_position), 'NEITHER TABLE EXISTS') AS columns_present
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('feed_formula_ingredients', 'feed_production_ingredients');

-- 2. The Prevexxion row itself, and how it is referenced by NAME and by CODE —
--    the two links that certainly do exist.
SELECT (SELECT COALESCE(string_agg(id::text || ' [' || name || '] code=' || COALESCE(code,'null')
          || ' unit=' || COALESCE(unit,'null'), ' | '), 'NOT PRESENT')
        FROM public.feed_ingredients WHERE name ILIKE '%prevexxion%' OR name ILIKE '%marek%') AS the_row,
       (SELECT COUNT(*) FROM public.feed_formula_ingredients
        WHERE ingredient_name ILIKE '%prevexxion%' OR ingredient_name ILIKE '%marek%') AS formula_lines_by_name,
       (SELECT COUNT(*) FROM public.feed_formula_ingredients
        WHERE ingredient_code IN (SELECT code FROM public.feed_ingredients
                                  WHERE (name ILIKE '%prevexxion%' OR name ILIKE '%marek%') AND code IS NOT NULL)) AS formula_lines_by_code;

-- 3. How big the leak actually is. 617 found a long list of feed ingredients
--    that are also in Medicine Master; count it properly and show how many of
--    those are used by any formula at all.
SELECT COUNT(*) AS ingredients_also_in_medicine_master,
       COUNT(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM public.feed_formula_ingredients f
         WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))) AS of_those_used_in_a_formula
FROM public.feed_ingredients fi
WHERE EXISTS (
  SELECT 1 FROM public.medicines_master m
  WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name), '\s+', ' ', 'g')));

-- 4. Name them, so the ones safe to remove are separable from the ones in use.
SELECT COALESCE(string_agg(fi.name || CASE WHEN EXISTS (
           SELECT 1 FROM public.feed_formula_ingredients f
           WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))
         THEN ' [IN A FORMULA]' ELSE ' [unused]' END, ' | ' ORDER BY fi.name), 'NONE') AS leaked_ingredients
FROM public.feed_ingredients fi
WHERE EXISTS (
  SELECT 1 FROM public.medicines_master m
  WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name), '\s+', ' ', 'g')));

-- 5. Totals for context.
SELECT (SELECT COUNT(*) FROM public.feed_ingredients) AS feed_ingredients_total,
       (SELECT COUNT(*) FROM public.feed_formula_ingredients) AS formula_lines_total,
       (SELECT COUNT(DISTINCT ingredient_name) FROM public.feed_formula_ingredients) AS distinct_names_used_in_formulas;
