-- Migration 192: stock_ledger was created without RLS policies/grants, so the app's
-- authenticated role cannot READ it → Feed Mill / Inventory show 0. Fix access.

-- Diagnostic: current grants for authenticated on stock_ledger (before fix)
SELECT 'grants_before' AS chk, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'stock_ledger' AND grantee IN ('authenticated','anon');

-- Ensure the API roles can access the table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_ledger TO authenticated;
GRANT SELECT ON public.stock_ledger TO anon;

-- Enable RLS with permissive policies (must add policy in same step, else RLS blocks all)
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sl_select ON public.stock_ledger;
CREATE POLICY sl_select ON public.stock_ledger FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS sl_insert ON public.stock_ledger;
CREATE POLICY sl_insert ON public.stock_ledger FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS sl_update ON public.stock_ledger;
CREATE POLICY sl_update ON public.stock_ledger FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS sl_delete ON public.stock_ledger;
CREATE POLICY sl_delete ON public.stock_ledger FOR DELETE TO authenticated USING (true);

-- Verify grants after
SELECT 'grants_after' AS chk, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'stock_ledger' AND grantee IN ('authenticated','anon')
ORDER BY grantee, privilege_type;
