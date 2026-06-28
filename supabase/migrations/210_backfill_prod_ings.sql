-- Migration 210: backfill production ingredient lines using kg_per_1000 OR percentage
-- (209 only used percentage; these formulas store kg_per_1000, so nothing inserted).
-- Inserting fires the now-corrected trigger -> writes production_out to stock_ledger.

-- Diagnostic: how the BCM/Male formula stores its amounts
SELECT 'A_formula_sample' AS chk, f.formula_code, fi.ingredient_name, fi.percentage, fi.kg_per_1000
FROM public.feed_formula_ingredients fi
JOIN public.feed_formulas f ON f.id = fi.formula_id
WHERE f.is_active = true
ORDER BY f.formula_code, fi.sort_order
LIMIT 6;

INSERT INTO public.feed_production_ingredients (production_id, ingredient_name, quantity_kg, ingredient_id)
SELECT l.id,
       fi.ingredient_name,
       ROUND(CASE WHEN COALESCE(fi.kg_per_1000,0) > 0
                  THEN COALESCE(fi.kg_per_1000,0) * COALESCE(l.quantity_kg,0) / 1000.0
                  ELSE COALESCE(fi.percentage,0) / 100.0 * COALESCE(l.quantity_kg,0) END, 3),
       (SELECT fe.id FROM public.feed_ingredients fe
         WHERE lower(fe.name) = lower(fi.ingredient_name) LIMIT 1)
FROM public.feed_production_log l
JOIN public.feed_formula_ingredients fi ON fi.formula_id = l.formula_id
WHERE l.formula_id IS NOT NULL
  AND (COALESCE(fi.kg_per_1000,0) > 0 OR COALESCE(fi.percentage,0) > 0)
  AND NOT EXISTS (
    SELECT 1 FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id);

-- Verify ingredient lines now exist + consumption written
SELECT 'B_ings_per_log' AS chk, l.id, l.quantity_kg,
  (SELECT COUNT(*) FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id) AS ing_lines,
  (SELECT ROUND(SUM(pi.quantity_kg),1) FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id) AS total_ing_kg
FROM public.feed_production_log l ORDER BY l.production_date DESC;

SELECT 'C_stock_out' AS chk, COUNT(*) AS production_out_rows, COALESCE(SUM(qty),0) AS total_kg_out
FROM public.stock_ledger WHERE txn_type = 'production_out';
