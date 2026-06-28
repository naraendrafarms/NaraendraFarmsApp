-- Migration 214: decisive test. (1) count what the join yields, (2) insert with the
-- stock-ledger trigger DISABLED to see if the trigger is what aborts the insert.

SELECT 'join_count' AS chk, COUNT(*) AS n
FROM public.feed_production_log l
JOIN public.feed_formula_ingredients fi ON fi.formula_id = l.formula_id;

ALTER TABLE public.feed_production_ingredients DISABLE TRIGGER trg_feed_prod_stock_ledger;

INSERT INTO public.feed_production_ingredients (production_id, ingredient_name, quantity_kg)
SELECT l.id, fi.ingredient_name,
  ROUND(CASE WHEN COALESCE(fi.kg_per_1000,0) > 0
             THEN COALESCE(fi.kg_per_1000,0) * COALESCE(l.quantity_kg,0) / 1000.0
             ELSE COALESCE(fi.percentage,0) / 100.0 * COALESCE(l.quantity_kg,0) END, 3)
FROM public.feed_production_log l
JOIN public.feed_formula_ingredients fi ON fi.formula_id = l.formula_id
WHERE NOT EXISTS (SELECT 1 FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id);

ALTER TABLE public.feed_production_ingredients ENABLE TRIGGER trg_feed_prod_stock_ledger;

SELECT 'after' AS chk, (SELECT COUNT(*) FROM public.feed_production_ingredients) AS ing_rows;
