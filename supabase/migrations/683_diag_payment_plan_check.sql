-- Diagnostic only. 682 reported Errors: 0 but printed none of its checks, and
-- this runner reports "already exists"/"does not exist" errors as success — so
-- the schema is read back on its own rather than trusted.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'MISSING') AS manual_item_columns
FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_plan_manual_items';

SELECT COALESCE(string_agg(table_name, ', ' ORDER BY table_name), 'NEITHER TABLE EXISTS') AS plan_tables
FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('payment_plan','payment_plan_line');

SELECT COALESCE(string_agg(tablename || '=' || policyname, ', '), 'NO POLICIES') AS plan_policies
FROM pg_policies WHERE schemaname='public' AND tablename IN ('payment_plan','payment_plan_line');

SELECT COUNT(*)::text AS manual_items,
       COUNT(*) FILTER (WHERE gross_amount IS NULL)::text AS without_gross,
       COUNT(*) FILTER (WHERE COALESCE(deduction_amount,0) > 0)::text AS with_deduction
FROM public.payment_plan_manual_items;
