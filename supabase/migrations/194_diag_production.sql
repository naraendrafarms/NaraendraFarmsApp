-- Migration 194: where is the just-added production? (read-only)

-- New table used by Feed Mill → Production tab
SELECT 'A_feed_production_log' AS chk, COUNT(*) AS rows FROM public.feed_production_log;

-- 5 most recent feed_production_log rows
SELECT 'B_recent_log' AS chk, id, production_date, formula_id, farm_id, quantity_kg, created_at
FROM public.feed_production_log ORDER BY created_at DESC NULLS LAST LIMIT 5;

-- Old table (legacy production page)
SELECT 'C_feed_production_old' AS chk, COUNT(*) AS rows FROM public.feed_production;

-- 5 most recent old feed_production rows
SELECT 'D_recent_old' AS chk, id, production_date, feed_type_id, quantity_kg, created_at
FROM public.feed_production ORDER BY created_at DESC NULLS LAST LIMIT 5;

-- Do recent log rows have a valid formula (FK now to feed_formulas)?
SELECT 'E_log_formula_valid' AS chk, COUNT(*) AS log_rows,
  COUNT(f.id) AS with_valid_formula
FROM public.feed_production_log l
LEFT JOIN public.feed_formulas f ON f.id = l.formula_id;
