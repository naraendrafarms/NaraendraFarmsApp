-- 617's delete never ran. 618 shows why:
--   feed_formula_ingredients.id, .formula_id, .ingredient_name, .ingredient_code,
--   .percentage, .kg_per_1000, .sort_order
-- There is NO ingredient_id column on that table — a formula line refers to its
-- ingredient by NAME and CODE only. 617 guarded on f.ingredient_id, so the
-- statement raised "column does not exist", which run_sql.py counts as SUCCESS,
-- and the row survived under a green "Errors: 0". (feed_production_ingredients
-- DOES have ingredient_id, so that guard was fine and is kept.)
--
-- 618 also answered the question that mattered:
--   the_row: [Prevexxion RN, INJVI/2 ML-1/2000 DS & Marek Diluent 400 ML]
--            code=MAREKSBOEN unit=Dose
--   formula_lines_by_name: 0   formula_lines_by_code: 0
-- Unused on both links, so it can go. The guards below still check at delete
-- time rather than trusting the reading from two minutes ago.

-- 1. Delete, guarded on the links that actually exist: name, code, and
--    production usage.
DELETE FROM public.feed_ingredients fi
WHERE (fi.name ILIKE '%prevexxion%' OR fi.name ILIKE '%marek%')
  AND NOT EXISTS (SELECT 1 FROM public.feed_formula_ingredients f
                  WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))
  AND NOT EXISTS (SELECT 1 FROM public.feed_formula_ingredients f
                  WHERE fi.code IS NOT NULL AND f.ingredient_code = fi.code)
  AND NOT EXISTS (SELECT 1 FROM public.feed_production_ingredients p
                  WHERE p.ingredient_id = fi.id);

-- 2. Gone, and the master still sound.
SELECT (SELECT COUNT(*) FROM public.feed_ingredients
        WHERE name ILIKE '%prevexxion%' OR name ILIKE '%marek%') AS prevexxion_rows_left,
       (SELECT COUNT(*) FROM public.feed_ingredients) AS feed_ingredients_total,
       (SELECT COUNT(*) FROM public.feed_formula_ingredients) AS formula_lines_total;

-- 3. No formula line was orphaned — every name a formula uses must still exist
--    in the ingredient master. This is the check that proves the delete was
--    safe, not just that it happened.
SELECT COUNT(DISTINCT f.ingredient_name) AS distinct_names_in_formulas,
       COUNT(DISTINCT f.ingredient_name) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.feed_ingredients fi
         WHERE LOWER(TRIM(fi.name)) = LOWER(TRIM(f.ingredient_name)))) AS names_with_no_ingredient_row
FROM public.feed_formula_ingredients f;

-- 4. The wider leak, for your decision — NOT touched here. 618 measured 42
--    feed ingredients that are also in Medicine Master, and ZERO of them used
--    by any formula. They arrived by the same PO route that is now closed.
SELECT COUNT(*) AS medicines_sitting_in_feed_ingredients,
       COUNT(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM public.feed_formula_ingredients f
         WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))) AS of_those_used_in_a_formula
FROM public.feed_ingredients fi
WHERE EXISTS (
  SELECT 1 FROM public.medicines_master m
  WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name), '\s+', ' ', 'g')));

-- 5. How much of the ingredient master is actually in use, for context.
SELECT COUNT(*) AS ingredients_total,
       COUNT(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM public.feed_formula_ingredients f
         WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))) AS used_by_a_formula,
       COUNT(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.feed_formula_ingredients f
         WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))) AS never_used_by_a_formula
FROM public.feed_ingredients fi;
