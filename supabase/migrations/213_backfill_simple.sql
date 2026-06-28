-- Migration 213: backfill production ingredients with a SIMPLE insert (no feed_ingredients
-- subquery). Previous backfills referenced feed_ingredients in a subquery; if that errored
-- with "does not exist", run_sql.py silently treats it as success and inserts nothing.
-- The consumption trigger resolves item_id from items by name, so we don't need it here.

INSERT INTO public.feed_production_ingredients (production_id, ingredient_name, quantity_kg)
SELECT l.id,
       fi.ingredient_name,
       ROUND(CASE WHEN COALESCE(fi.kg_per_1000,0) > 0
                  THEN COALESCE(fi.kg_per_1000,0) * COALESCE(l.quantity_kg,0) / 1000.0
                  ELSE COALESCE(fi.percentage,0) / 100.0 * COALESCE(l.quantity_kg,0) END, 3)
FROM public.feed_production_log l
JOIN public.feed_formula_ingredients fi ON fi.formula_id = l.formula_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id);

SELECT 'after' AS chk,
  (SELECT COUNT(*) FROM public.feed_production_ingredients) AS ing_rows,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE txn_type='production_out') AS prod_out_rows,
  (SELECT COALESCE(SUM(qty),0) FROM public.stock_ledger WHERE txn_type='production_out') AS prod_out_kg;
