-- Diagnostic only, feed mill alone. 14,16,849 kg recorded as consumed by
-- production but only 5,54,639 kg taken out of the ledger. The trigger writes
-- one production_out row per ingredient line, keyed on feed_prod_id, so the
-- gap can be traced batch by batch.
--
-- One thing to rule out first: the app reads BOTH quantity_kg and qty_used_kg
-- in different places, while the trigger reads quantity_kg only. If some rows
-- carry the quantity in the other column, the trigger wrote a zero.

-- 1. Which quantity columns exist, and what each one sums to.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'NONE') AS qty_columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='feed_production_ingredients'
  AND (column_name ILIKE '%qty%' OR column_name ILIKE '%quantity%');

-- 2. Ingredient rows: how many, how many with each quantity populated.
SELECT COUNT(*)::text AS ingredient_rows,
       COUNT(quantity_kg)::text AS with_quantity_kg,
       ROUND(COALESCE(SUM(quantity_kg),0))::text AS sum_quantity_kg,
       COUNT(*) FILTER (WHERE COALESCE(quantity_kg,0) = 0)::text AS rows_with_zero_quantity
FROM public.feed_production_ingredients;

-- 3. Ledger rows written against production, and how many productions they cover.
SELECT COUNT(*)::text AS production_out_rows,
       COUNT(DISTINCT feed_prod_id)::text AS productions_covered,
       ROUND(COALESCE(SUM(qty),0))::text AS sum_qty
FROM public.stock_ledger WHERE txn_type = 'production_out';

-- 4. Productions whose ingredient total does NOT match their ledger total --
--    the batches where stock did not come down properly.
SELECT COUNT(*)::text AS batches_checked,
       COUNT(*) FILTER (WHERE ABS(ing_kg - led_kg) > 1)::text AS batches_mismatched,
       ROUND(SUM(ing_kg - led_kg) FILTER (WHERE ABS(ing_kg - led_kg) > 1))::text AS total_kg_not_deducted
FROM (
  SELECT l.id,
         COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients i
                   WHERE i.production_id = l.id), 0) AS ing_kg,
         COALESCE((SELECT SUM(qty) FROM public.stock_ledger s
                   WHERE s.feed_prod_id = l.id AND s.txn_type = 'production_out'), 0) AS led_kg
  FROM public.feed_production_log l
) x;

-- 5. The worst offenders, so a real batch can be opened and checked by hand.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NONE') AS worst_mismatches
FROM (
  SELECT to_char(l.production_date,'DD/MM/YY') || ' batch=' || COALESCE(l.batch_no,'-')
         || ' ing=' || ROUND(COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients i
                                       WHERE i.production_id = l.id),0))
         || ' ledger=' || ROUND(COALESCE((SELECT SUM(qty) FROM public.stock_ledger s
                                          WHERE s.feed_prod_id = l.id AND s.txn_type='production_out'),0)) AS line,
         COALESCE((SELECT SUM(quantity_kg) FROM public.feed_production_ingredients i WHERE i.production_id = l.id),0)
         - COALESCE((SELECT SUM(qty) FROM public.stock_ledger s WHERE s.feed_prod_id = l.id AND s.txn_type='production_out'),0) AS gap
  FROM public.feed_production_log l
  ORDER BY gap DESC LIMIT 6
) y;
