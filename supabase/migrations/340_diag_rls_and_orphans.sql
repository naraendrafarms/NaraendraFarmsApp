-- Live-database audit: RLS coverage across every public table, plus a
-- sweep for orphaned foreign-key data (child rows whose referenced parent
-- no longer exists) across the app's most important relationships.

-- 1. Any public table WITHOUT row-level security enabled at all
SELECT c.relname AS table_without_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
ORDER BY 1;

-- 2. Tables WITH RLS enabled but zero policies defined (rows become
--    completely inaccessible via the anon/authenticated API — a common
--    "silently broken" state, not a security hole)
SELECT c.relname AS rls_enabled_no_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname)
ORDER BY 1;

-- 3. Orphaned FK data sweep (parent row missing) across key relationships
SELECT 'grn.item_id -> items' AS relationship, COUNT(*) AS orphan_count
FROM public.grn g WHERE g.item_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = g.item_id)
UNION ALL
SELECT 'pending_payments.bank_account_id -> bank_accounts', COUNT(*)
FROM public.pending_payments p WHERE p.bank_account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.bank_accounts b WHERE b.id = p.bank_account_id)
UNION ALL
SELECT 'cash_book.pending_payment_id -> pending_payments', COUNT(*)
FROM public.cash_book c WHERE c.pending_payment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.pending_payments p WHERE p.id = c.pending_payment_id)
UNION ALL
SELECT 'bank_transactions.linked_payment_id -> pending_payments', COUNT(*)
FROM public.bank_transactions b WHERE b.linked_payment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.pending_payments p WHERE p.id = b.linked_payment_id)
UNION ALL
SELECT 'salary_monthly.employee_id -> employees', COUNT(*)
FROM public.salary_monthly s WHERE s.employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id = s.employee_id)
UNION ALL
SELECT 'flocks.laying_farm_id -> farms', COUNT(*)
FROM public.flocks f WHERE f.laying_farm_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.farms fa WHERE fa.id = f.laying_farm_id)
UNION ALL
SELECT 'nhe_sales.party_id -> parties', COUNT(*)
FROM public.nhe_sales n WHERE n.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = n.party_id)
UNION ALL
SELECT 'he_dispatch.party_id -> parties', COUNT(*)
FROM public.he_dispatch h WHERE h.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = h.party_id)
UNION ALL
SELECT 'grn.party_id -> parties', COUNT(*)
FROM public.grn g WHERE g.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = g.party_id)
UNION ALL
SELECT 'pending_payments.party_id -> parties', COUNT(*)
FROM public.pending_payments p WHERE p.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties pa WHERE pa.id = p.party_id)
ORDER BY 2 DESC;
