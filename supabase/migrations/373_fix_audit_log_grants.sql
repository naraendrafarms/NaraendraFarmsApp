-- Migration 373: RLS policies alone are not enough — Postgres also requires
-- a base table GRANT before RLS policies are even consulted. All our
-- previous "verify" migrations ran via the service-role connection, which
-- BYPASSES RLS entirely, so they could never have proven the 369 fix works
-- for the real app (which authenticates as anon/authenticated via
-- PostgREST). The user's live in-app test still shows no new audit rows,
-- so re-check + fix both layers together.

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'audit_log'
ORDER BY grantee, privilege_type;

GRANT INSERT ON public.audit_log TO anon, authenticated;
GRANT SELECT ON public.audit_log TO anon, authenticated;

SELECT polname, cmd, roles::text
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
WHERE c.relname = 'audit_log';
