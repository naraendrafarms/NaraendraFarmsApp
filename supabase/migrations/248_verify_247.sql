-- Diagnostic only (SELECT), no data changes. Migration 247's own verification
-- SELECTs were statements 8-10 out of 10, past run_sql.py's "only print first
-- 5 statements" window, so nothing printed. Re-checking here as statements 1-3.
SELECT category, count(*) FROM public.grn GROUP BY category ORDER BY 2 DESC;
SELECT count(*) AS spermed_master_rows FROM public.feed_ingredients WHERE name ILIKE '%sperm%';
SELECT count(*) AS still_unresolved_fpi FROM public.feed_production_ingredients WHERE ingredient_id IS NULL;
