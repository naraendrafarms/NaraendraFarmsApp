-- Follow-up: 276 showed pending_payments RLS policy check returned 0 rows
-- (relrowsecurity=true but no policy printed). Confirm count explicitly and
-- pull recent GRN vs pending_payments rows (put first since run_sql.py only
-- prints statements 1-5).

SELECT COUNT(*) AS policy_count FROM pg_policies
WHERE schemaname='public' AND tablename='pending_payments';

SELECT polname, cmd, roles::text FROM pg_policies
WHERE schemaname='public' AND tablename='pending_payments';

SELECT g.grn_no, p.name AS vendor, g.grn_date, g.total_amount, g.created_at
FROM public.grn g LEFT JOIN public.parties p ON p.id = g.party_id
ORDER BY g.created_at DESC LIMIT 5;

SELECT pp.vendor_name, pp.grn_no, pp.grn_date, pp.invoice_amount, pp.created_at
FROM public.pending_payments pp
ORDER BY pp.created_at DESC LIMIT 5;

SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='pending_payments' AND grantee='authenticated';
