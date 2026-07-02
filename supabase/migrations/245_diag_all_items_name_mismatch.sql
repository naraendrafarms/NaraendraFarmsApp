-- Diagnostic only (SELECT), no data changes. Checking if the SPERMED
-- name/merge issue is a one-off or a systemic code problem affecting
-- all feed ingredients (duplicate master rows, GRN item_name drift,
-- unresolved ingredient_id links).

-- 1) Any feed_ingredients still duplicated case/whitespace-insensitively
SELECT lower(trim(name)) AS norm_name, count(*) AS dup_count,
  array_agg(name) AS variants, array_agg(id) AS ids
FROM public.feed_ingredients
GROUP BY lower(trim(name))
HAVING count(*) > 1
ORDER BY dup_count DESC;

-- 2) GRN item_names (category='Feed') that don't case/whitespace-insensitively
--    match ANY current feed_ingredients.name -> these GRN rows are invisible
--    to the rate lookup no matter what production entry does
SELECT DISTINCT g.item_name
FROM public.grn g
WHERE g.category = 'Feed'
  AND NOT EXISTS (
    SELECT 1 FROM public.feed_ingredients fi
    WHERE lower(trim(fi.name)) = lower(trim(g.item_name))
  )
ORDER BY g.item_name;

-- 3) feed_production_ingredients rows with no resolved ingredient_id,
--    grouped by name, across ALL ingredients (not just SPERMED)
SELECT ingredient_name, count(*) AS unresolved_count
FROM public.feed_production_ingredients
WHERE ingredient_id IS NULL
GROUP BY ingredient_name
ORDER BY unresolved_count DESC;

-- 4) All current GRN item_names for Feed category (so we can see the exact
--    live spelling used for SPERMED's purchase rows, whatever it is)
SELECT DISTINCT item_name FROM public.grn WHERE category = 'Feed' ORDER BY item_name;
