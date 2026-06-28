-- Migration 203: read-only. (1) Do the active feed formulas actually have ingredient
-- lines? (Production can only show/consume ingredients that the formula defines.)
-- (2) Where do employee advances actually live — employee_advances types vs the
-- salary_monthly advance columns.

-- 1. Ingredient line count per active formula
SELECT 'A_formula_ings' AS chk, f.formula_code, f.formula_name,
  (SELECT COUNT(*) FROM public.feed_formula_ingredients i WHERE i.formula_id = f.id) AS ingredient_lines
FROM public.feed_formulas f
WHERE f.is_active = true
ORDER BY f.formula_code;

-- 2a. employee_advances grouped by type (we saw all 63 are 'other')
SELECT 'B_adv_by_type' AS chk, advance_type, COUNT(*) AS rows, SUM(amount) AS total
FROM public.employee_advances GROUP BY advance_type ORDER BY advance_type;

-- 2b. salary_monthly advance columns — the running advance balance lives here
SELECT 'C_salary_adv_cols' AS chk,
  COUNT(*) AS rows,
  SUM(COALESCE(advance,0))         AS sum_advance,
  SUM(COALESCE(advance_opening,0)) AS sum_advance_opening,
  SUM(COALESCE(further_advance,0)) AS sum_further_advance,
  SUM(COALESCE(advance_closing,0)) AS sum_advance_closing
FROM public.salary_monthly;

-- 2c. any salary rows that DO carry an advance value (to locate the ~13718.5)
SELECT 'D_salary_with_adv' AS chk, sm.month, e.name,
  sm.advance, sm.advance_opening, sm.further_advance, sm.advance_closing
FROM public.salary_monthly sm JOIN public.employees e ON e.id = sm.employee_id
WHERE COALESCE(sm.advance,0) + COALESCE(sm.advance_opening,0) + COALESCE(sm.further_advance,0) + COALESCE(sm.advance_closing,0) > 0
ORDER BY sm.month DESC LIMIT 10;
