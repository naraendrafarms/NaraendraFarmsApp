-- Diagnostic only. The farm confirms all 104 batches are real production, with
-- April and May entered as consolidated single-day entries and the rest daily.
-- So the consumption lines are right and the LEDGER is what is missing.
--
-- Which batches, by month: if the gap sits in April and May, the cause is that
-- those were entered before the consumption trigger was repaired (migration
-- 209, which fixed a trigger that had never written anything) and the repair
-- was not backfilled for them.

-- 1. Mismatched batches by month of production.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NONE') AS mismatch_by_month
FROM (
  SELECT to_char(date_trunc('month', l.production_date),'YYYY-MM')
         || ': ' || COUNT(*) || ' batch(es), ' || ROUND(SUM(gap)) || ' kg not deducted' AS line
  FROM (
    SELECT l.id, l.production_date,
           COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients i
                     WHERE i.production_id = l.id),0)
           - COALESCE((SELECT SUM(qty) FROM public.stock_ledger s
                       WHERE s.feed_prod_id = l.id AND s.txn_type='production_out'),0) AS gap
    FROM public.feed_production_log l
  ) l
  WHERE l.gap > 1
  GROUP BY date_trunc('month', l.production_date)
) x;

-- 2. Ingredient lines with NO ledger row of their own -- the exact rows a
--    backfill would have to write.
SELECT COUNT(*)::text AS ingredient_lines_without_ledger_row,
       ROUND(COALESCE(SUM(i.quantity_kg),0))::text AS kg_they_represent,
       COUNT(DISTINCT i.production_id)::text AS across_batches
FROM public.feed_production_ingredients i
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger s
  WHERE s.feed_prod_id = i.production_id
    AND s.txn_type = 'production_out'
    AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,''))
);

-- 3. All production by month, for context on where April and May sit.
SELECT COALESCE(string_agg(mth || ': ' || n || ' batch(es)', ' | ' ORDER BY mth), 'NONE') AS batches_by_month
FROM (
  SELECT to_char(date_trunc('month', production_date),'YYYY-MM') AS mth, COUNT(*) AS n
  FROM public.feed_production_log GROUP BY 1
) y;

-- 4. Do the ingredient names on the missing lines exist in the items master?
--    A name that matches nothing still posts (item_id just stays null), so this
--    is only to know what the backfilled rows would look like.
SELECT COUNT(DISTINCT i.ingredient_name)::text AS distinct_ingredients_missing,
       COUNT(DISTINCT i.ingredient_name) FILTER (
         WHERE NOT EXISTS (SELECT 1 FROM public.items it
                           WHERE lower(it.name) = lower(i.ingredient_name)))::text AS names_not_in_items_master
FROM public.feed_production_ingredients i
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger s
  WHERE s.feed_prod_id = i.production_id AND s.txn_type = 'production_out'
    AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,'')));
