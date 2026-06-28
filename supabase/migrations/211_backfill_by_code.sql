-- Migration 211: backfill production ingredients by FORMULA CODE. The production log's
-- formula_id points to a formula row that has no ingredient lines (legacy rename), while
-- the ingredients live under another row with the same code. Match by code to reach them.

-- Diagnostic: does the log's formula_id row actually have ingredients?
SELECT 'A_log_formula' AS chk, l.id AS log_id, l.formula_id, lf.formula_code,
  (SELECT COUNT(*) FROM public.feed_formula_ingredients i WHERE i.formula_id = l.formula_id) AS ings_on_log_formula
FROM public.feed_production_log l
LEFT JOIN public.feed_formulas lf ON lf.id = l.formula_id
ORDER BY l.production_date DESC;

WITH log_formula AS (
  SELECT l.id AS log_id, l.quantity_kg, lower(lf.formula_code) AS code
  FROM public.feed_production_log l
  JOIN public.feed_formulas lf ON lf.id = l.formula_id
  WHERE NOT EXISTS (SELECT 1 FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id)
),
src AS (  -- one formula per code that actually HAS ingredient lines (prefer active)
  SELECT DISTINCT ON (lower(f.formula_code)) lower(f.formula_code) AS code, f.id AS fid
  FROM public.feed_formulas f
  WHERE EXISTS (SELECT 1 FROM public.feed_formula_ingredients i WHERE i.formula_id = f.id)
  ORDER BY lower(f.formula_code), f.is_active DESC, f.id
)
INSERT INTO public.feed_production_ingredients (production_id, ingredient_name, quantity_kg, ingredient_id)
SELECT lfm.log_id,
       fi.ingredient_name,
       ROUND(CASE WHEN COALESCE(fi.kg_per_1000,0) > 0
                  THEN COALESCE(fi.kg_per_1000,0) * COALESCE(lfm.quantity_kg,0) / 1000.0
                  ELSE COALESCE(fi.percentage,0) / 100.0 * COALESCE(lfm.quantity_kg,0) END, 3),
       (SELECT fe.id FROM public.feed_ingredients fe WHERE lower(fe.name) = lower(fi.ingredient_name) LIMIT 1)
FROM log_formula lfm
JOIN src ON src.code = lfm.code
JOIN public.feed_formula_ingredients fi ON fi.formula_id = src.fid;

-- Verify
SELECT 'B_ings_per_log' AS chk, l.id, l.quantity_kg,
  (SELECT COUNT(*) FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id) AS ing_lines,
  (SELECT ROUND(SUM(pi.quantity_kg),1) FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id) AS total_ing_kg
FROM public.feed_production_log l ORDER BY l.production_date DESC;

SELECT 'C_stock_out' AS chk, COUNT(*) AS production_out_rows, COALESCE(SUM(qty),0) AS total_kg_out
FROM public.stock_ledger WHERE txn_type = 'production_out';
