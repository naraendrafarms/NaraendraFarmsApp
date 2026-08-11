-- PREVEXXION MAREK's Vac is a vaccine that ended up in Feed Ingredients,
-- because receiving a PO used to auto-create a feed ingredient whenever that
-- PO's Material Type read "Feed Raw Material" — one dropdown, trusted blindly.
-- That auto-create is now removed from the app.
--
-- Removing the row it left behind is only safe if nothing depends on it.
-- feed_formula_ingredients links to an ingredient by ingredient_id AND carries
-- ingredient_name / ingredient_code as plain text (that is why merging items
-- never fixed the feed pricing — noted in lib/itemAliases.ts). So BOTH have to
-- be checked: an id link, and a name match. Feed production usage is checked
-- too — a formula is not the only thing that can reference it.
--
-- Statement 1 reports before touching anything. Statement 2 deletes ONLY if
-- every one of those checks is empty; if any reference exists the delete
-- matches nothing and statement 4 will still show the row, rather than
-- silently breaking a formula.

-- 1. Everything that could reference it, counted before any change.
SELECT (SELECT COALESCE(string_agg(id::text || ' [' || name || '] unit=' || COALESCE(unit,'null')
          || ' active=' || COALESCE(is_active::text,'null'), ' | '), 'NOT IN FEED INGREDIENTS')
        FROM public.feed_ingredients WHERE name ILIKE '%prevexxion%' OR name ILIKE '%marek%') AS the_row,
       (SELECT COUNT(*) FROM public.feed_formula_ingredients f
        WHERE f.ingredient_id IN (SELECT id FROM public.feed_ingredients
                                  WHERE name ILIKE '%prevexxion%' OR name ILIKE '%marek%')) AS formula_links_by_id,
       (SELECT COUNT(*) FROM public.feed_formula_ingredients f
        WHERE f.ingredient_name ILIKE '%prevexxion%' OR f.ingredient_name ILIKE '%marek%') AS formula_links_by_name,
       (SELECT COUNT(*) FROM public.feed_production_ingredients p
        WHERE p.ingredient_id IN (SELECT id FROM public.feed_ingredients
                                  WHERE name ILIKE '%prevexxion%' OR name ILIKE '%marek%')) AS production_uses;

-- 2. Delete only if genuinely unreferenced, on every route.
DELETE FROM public.feed_ingredients fi
WHERE (fi.name ILIKE '%prevexxion%' OR fi.name ILIKE '%marek%')
  AND NOT EXISTS (SELECT 1 FROM public.feed_formula_ingredients f WHERE f.ingredient_id = fi.id)
  AND NOT EXISTS (SELECT 1 FROM public.feed_production_ingredients p WHERE p.ingredient_id = fi.id)
  AND NOT EXISTS (SELECT 1 FROM public.feed_formula_ingredients f
                  WHERE LOWER(TRIM(f.ingredient_name)) = LOWER(TRIM(fi.name)));

-- 3. The same question for every OTHER medicine or vaccine that may have
--    arrived in Feed Ingredients by the same route — a feed ingredient whose
--    name also exists in Medicine Master has almost certainly leaked in.
SELECT COALESCE(string_agg(fi.name || ' (in medicine master too)', ' | ' ORDER BY fi.name), 'NONE') AS suspect_ingredients
FROM public.feed_ingredients fi
WHERE EXISTS (
  SELECT 1 FROM public.medicines_master m
  WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = LOWER(REGEXP_REPLACE(TRIM(fi.name), '\s+', ' ', 'g')));

-- 4. Did it go, and is the feed ingredient master otherwise sound.
SELECT (SELECT COUNT(*) FROM public.feed_ingredients
        WHERE name ILIKE '%prevexxion%' OR name ILIKE '%marek%') AS prevexxion_rows_left,
       (SELECT COUNT(*) FROM public.feed_ingredients) AS feed_ingredients_total,
       (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.feed_ingredients GROUP BY 1 HAVING COUNT(*) > 1) d) AS duplicate_ingredient_names;

-- 5. No formula was left pointing at a deleted ingredient.
SELECT COUNT(*) AS formula_lines_total,
       COUNT(*) FILTER (WHERE f.ingredient_id IS NOT NULL AND fi.id IS NULL) AS formula_lines_pointing_nowhere
FROM public.feed_formula_ingredients f
LEFT JOIN public.feed_ingredients fi ON fi.id = f.ingredient_id;
