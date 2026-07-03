-- Diagnostic: user reports GRN entries no longer syncing into Pending Payments.
-- Check trigger/constraint/RLS state plus recent GRN vs pending_payments rows.

SELECT tgname, tgenabled, tgrelid::regclass AS on_table
FROM pg_trigger
WHERE tgrelid = 'public.grn'::regclass AND NOT tgisinternal;

SELECT conname, contype, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.pending_payments'::regclass;

SELECT relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.pending_payments'::regclass;

SELECT polname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'pending_payments';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='pending_payments' AND grantee IN ('authenticated','anon');

SELECT g.grn_no, p.name AS vendor, g.party_id, g.grn_date, g.total_amount, g.basic_amount, g.created_at
FROM public.grn g
LEFT JOIN public.parties p ON p.id = g.party_id
ORDER BY g.created_at DESC
LIMIT 10;

SELECT pp.vendor_name, pp.grn_no, pp.grn_date, pp.invoice_amount, pp.net_payable, pp.created_at
FROM public.pending_payments pp
ORDER BY pp.created_at DESC NULLS LAST
LIMIT 10;
