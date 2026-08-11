-- You see 34 Feed Ingredients in Item Master; I reported 104. Both are right,
-- because they are TWO DIFFERENT TABLES:
--
--   public.items             — Item Master, the one you curate and re-categorise
--   public.feed_ingredients  — a separate, older master used by the Feed Mill
--                              (formulas, production, ingredient rates)
--
-- They are not linked. Nothing syncs them. Re-categorising a row in Item Master
-- does not touch feed_ingredients, which is why a vaccine you moved to the
-- right section in Item Master was still sitting in the feed ingredient list.
-- The PO receipt used to write to feed_ingredients directly (now removed), so
-- that table accumulated everything the PO said was a raw material.
--
-- Establish exactly what is in each and how they overlap.

-- 1. Item Master by category — where the 34 comes from.
SELECT COALESCE(string_agg(cat || '=' || c, ', ' ORDER BY c DESC), 'NONE') AS items_by_category,
       (SELECT COUNT(*) FROM public.items) AS items_total
FROM (SELECT COALESCE(category,'(none)') AS cat, COUNT(*) AS c FROM public.items GROUP BY 1) x;

-- 2. The feed_ingredients table: how many, how many are actually used by a
--    formula, and how many exist in Item Master at all.
SELECT COUNT(*) AS feed_ingredients_total,
       COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.feed_formula_ingredients f
         WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)))) AS used_by_a_formula,
       COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.items i
         WHERE LOWER(REGEXP_REPLACE(TRIM(i.name),'\s+',' ','g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name),'\s+',' ','g')))) AS also_in_item_master,
       COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.items i
         WHERE LOWER(REGEXP_REPLACE(TRIM(i.name),'\s+',' ','g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name),'\s+',' ','g')))) AS not_in_item_master
FROM public.feed_ingredients fi;

-- 3. The ones that MATTER: every feed ingredient a formula actually uses, with
--    the category Item Master gives it. Anything not reading "Feed Ingredient"
--    here is a mismatch between the two masters.
SELECT COALESCE(string_agg(fi.name || ' → ' || COALESCE((
           SELECT i.category FROM public.items i
           WHERE LOWER(REGEXP_REPLACE(TRIM(i.name),'\s+',' ','g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name),'\s+',' ','g'))
           LIMIT 1), 'NOT IN ITEM MASTER'), ' | ' ORDER BY fi.name), 'NONE') AS used_ingredients_and_their_item_category
FROM public.feed_ingredients fi
WHERE EXISTS (SELECT 1 FROM public.feed_formula_ingredients f
              WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)));

-- 4. The 11 names a formula uses that have NO row in feed_ingredients at all —
--    these are the ones that can silently price at zero.
SELECT COALESCE(string_agg(DISTINCT f.ingredient_name, ' | '), 'NONE') AS formula_names_with_no_ingredient_row
FROM public.feed_formula_ingredients f
WHERE NOT EXISTS (SELECT 1 FROM public.feed_ingredients fi
                  WHERE LOWER(TRIM(fi.name)) = LOWER(TRIM(f.ingredient_name)));

-- 5. Item Master's own Feed Ingredient category vs the feed_ingredients table —
--    how far apart the two lists actually are.
SELECT (SELECT COUNT(*) FROM public.items WHERE category ILIKE '%feed%ingredient%') AS item_master_feed_ingredients,
       (SELECT COUNT(*) FROM public.items i WHERE i.category ILIKE '%feed%ingredient%'
        AND NOT EXISTS (SELECT 1 FROM public.feed_ingredients fi
          WHERE LOWER(REGEXP_REPLACE(TRIM(fi.name),'\s+',' ','g')) = LOWER(REGEXP_REPLACE(TRIM(i.name),'\s+',' ','g')))) AS in_item_master_only,
       (SELECT COUNT(*) FROM public.feed_ingredients fi
        WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.category ILIKE '%feed%ingredient%'
          AND LOWER(REGEXP_REPLACE(TRIM(i.name),'\s+',' ','g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name),'\s+',' ','g')))) AS in_feed_table_only;
