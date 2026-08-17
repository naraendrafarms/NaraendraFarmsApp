-- Diagnostic only. Manual items are not saving. The form now writes
-- gross_amount / deduction_amount / deduction_reason, added in migration 682 --
-- but 682's verification never printed, and this runner reports a failed
-- "column does not exist" as SUCCESS. If those columns are missing, every
-- insert is rejected and the row silently never appears.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS manual_item_columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='payment_plan_manual_items';

SELECT COALESCE(string_agg(policyname || '=' || cmd, ', '), 'NO POLICIES') AS policies
FROM pg_policies WHERE schemaname='public' AND tablename='payment_plan_manual_items';

SELECT COUNT(*)::text AS rows_now FROM public.payment_plan_manual_items;
