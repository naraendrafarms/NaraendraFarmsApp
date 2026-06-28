-- Migration 202: read-only. Check RLS + grants for the tables behind salaries,
-- advances, and feed-mill production/formula ingredients, plus any views that the
-- authenticated role might be blocked from reading.

-- A. RLS enabled + policy count + grants for the relevant TABLES
SELECT 'A_table_rls' AS chk,
  c.relname AS tbl,
  c.relrowsecurity AS rls_on,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policies,
  has_table_privilege('authenticated', 'public.'||c.relname, 'SELECT') AS sel,
  has_table_privilege('authenticated', 'public.'||c.relname, 'INSERT') AS ins,
  has_table_privilege('authenticated', 'public.'||c.relname, 'UPDATE') AS upd,
  has_table_privilege('authenticated', 'public.'||c.relname, 'DELETE') AS del
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
  AND c.relname IN ('employee_advances','salary_monthly','employees',
                    'feed_production_log','feed_production_ingredients',
                    'feed_formulas','feed_formula_ingredients','feed_ingredients','items')
ORDER BY c.relname;

-- B. Any VIEW that authenticated cannot SELECT (blocked views)
SELECT 'B_blocked_views' AS chk, c.relname AS view_name,
  has_table_privilege('authenticated', 'public.'||c.relname, 'SELECT') AS sel
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='v'
  AND has_table_privilege('authenticated', 'public.'||c.relname, 'SELECT') = false
ORDER BY c.relname;

-- C. Sanity: how many advance rows exist, and a sample of their salary_month values
SELECT 'C_adv_count' AS chk, COUNT(*) AS rows,
  COUNT(*) FILTER (WHERE advance_type IS DISTINCT FROM 'other') AS advance_rows,
  COUNT(*) FILTER (WHERE advance_type = 'other') AS other_rows
FROM public.employee_advances;

SELECT 'D_adv_sample' AS chk, employee_id, salary_month, advance_type, amount
FROM public.employee_advances ORDER BY advance_date DESC NULLS LAST LIMIT 8;

-- E. salary_monthly: how many rows have advance=0 but the employee has advances that month
SELECT 'E_missing_adv' AS chk, COUNT(*) AS salary_rows_missing_advance
FROM public.salary_monthly sm
WHERE COALESCE(sm.advance,0) = 0
  AND EXISTS (
    SELECT 1 FROM public.employee_advances ea
    WHERE ea.employee_id = sm.employee_id
      AND ea.salary_month = to_char(sm.month, 'YYYY-MM')
      AND ea.advance_type IS DISTINCT FROM 'other');
