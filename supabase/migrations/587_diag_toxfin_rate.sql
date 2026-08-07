-- Diagnostic only (no schema changes).
--
-- Feed Mill Production shows Toxfin 360 Dry at Rs 0.00 while other ingredients
-- in the same formula price fine. The rate comes from grn rows where
-- category = 'Feed Ingredient', matched on lower(trim(item_name)), with
-- stock_ledger 'opening'/'adjustment_in' rows as a second source. So a zero
-- means one of: no GRN at all, a GRN filed under a different category, a name
-- that does not match exactly, or a null price_per_unit.
-- Measure which, rather than guess.

-- 1. Exactly what the formula asks for — the ingredient name as stored.
SELECT COALESCE(string_agg(DISTINCT '[' || ingredient_name || ']', ', '), 'NONE') AS formula_names
FROM public.feed_formula_ingredients
WHERE ingredient_name ILIKE '%toxfin%';

-- 2. Every GRN line mentioning Toxfin, WHATEVER its category — this shows if
--    it was purchased under a category the rate lookup never reads.
SELECT COALESCE(string_agg(
         '[' || COALESCE(item_name,'') || '] cat=' || COALESCE(category,'(null)') ||
         ' price=' || COALESCE(price_per_unit::text,'(null)') ||
         ' date=' || COALESCE(grn_date::text,'(null)'), ' | ' ORDER BY grn_date DESC), 'NO GRN ROWS') AS grn_rows
FROM public.grn
WHERE item_name ILIKE '%toxfin%';

-- 3. Stock ledger fallback rows for it.
SELECT COALESCE(string_agg(
         '[' || COALESCE(item_name,'') || '] type=' || COALESCE(txn_type,'') ||
         ' price=' || COALESCE(unit_price::text,'(null)'), ' | '), 'NONE') AS ledger_rows
FROM public.stock_ledger
WHERE item_name ILIKE '%toxfin%';

-- 4. Does an alias exist that would map the formula name to the purchase name?
SELECT COALESCE(string_agg('[' || a.alias || '] -> [' || i.name || '] cat=' || i.category, ', '), 'NONE') AS aliases
FROM public.item_aliases a
JOIN public.items i ON i.id = a.item_id
WHERE a.alias ILIKE '%toxfin%' OR i.name ILIKE '%toxfin%';

-- 5. The wider question: how many feed formula ingredients have NO matching
--    priced GRN line at all? Toxfin may not be the only silent zero.
SELECT COUNT(*) AS formula_ingredients_without_price
FROM (
  SELECT DISTINCT lower(trim(ingredient_name)) AS n
  FROM public.feed_formula_ingredients
  WHERE COALESCE(trim(ingredient_name), '') <> ''
) f
WHERE NOT EXISTS (
  SELECT 1 FROM public.grn g
  WHERE g.category = 'Feed Ingredient'
    AND g.price_per_unit IS NOT NULL
    AND lower(trim(g.item_name)) = f.n
) AND NOT EXISTS (
  SELECT 1 FROM public.stock_ledger s
  WHERE s.txn_type IN ('opening','adjustment_in')
    AND s.unit_price IS NOT NULL
    AND lower(trim(s.item_name)) = f.n
);
