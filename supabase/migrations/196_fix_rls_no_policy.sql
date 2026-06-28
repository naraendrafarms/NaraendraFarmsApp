-- Migration 196: Add a permissive policy to every public table that has RLS ENABLED
-- but NO policy (which silently blocks the app from reading/writing it — same class of
-- bug as stock_ledger). Idempotent: only adds where a policy is missing.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS t
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity = true
      AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename = c.relname)
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      r.t || '_auth_all', r.t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.t);
  END LOOP;
END $$;

-- Verify: should now be 0 tables with RLS-enabled-and-no-policy
SELECT 'rls_no_policy_after' AS chk, COUNT(*) AS n
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity = true
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename = c.relname);
