-- Fix: "new row violates row-level security policy for table cull_bird_rate".
--
-- My omission. Migrations 667 and 668 created he_vendor_rate_tier and
-- cull_bird_rate but never gave either an RLS policy, so the app -- which
-- connects as the authenticated role -- is refused on every INSERT, UPDATE and
-- DELETE. It was not obvious from the migration logs because run_sql.py
-- connects as the service role, which bypasses RLS entirely: the seeded Hitech
-- tiers went in without complaint even though the Vendor Rates screen could not
-- have added one.
--
-- Both tables get the same policy every other table in this app uses (see
-- migration 266): full access for any authenticated user.

ALTER TABLE public.cull_bird_rate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all" ON public.cull_bird_rate;
CREATE POLICY "auth_all" ON public.cull_bird_rate FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.he_vendor_rate_tier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all" ON public.he_vendor_rate_tier;
CREATE POLICY "auth_all" ON public.he_vendor_rate_tier FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- VERIFY 5: both tables must show rowsecurity = true AND carry a policy. RLS on
-- with NO policy is the state that caused this error -- it denies everything
-- rather than allowing everything, so "RLS enabled" alone is not the fix.
SELECT COALESCE(string_agg(c.relname || ': rls=' || c.relrowsecurity
       || ' policies=' || (SELECT COUNT(*) FROM pg_policies p
                           WHERE p.schemaname = 'public' AND p.tablename = c.relname), ', '), 'NONE') AS rls_state
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('cull_bird_rate', 'he_vendor_rate_tier');

-- VERIFY 6: the same check across every table this session created or touched,
-- so no other new table is sitting in the same broken state.
SELECT COALESCE(string_agg(tbl, ', ' ORDER BY tbl), 'NONE - all fine') AS tables_with_rls_but_no_policy
FROM (
  SELECT c.relname AS tbl
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
    AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename = c.relname)
) x;

-- VERIFY 7: the seeded Hitech tiers survived untouched.
SELECT COUNT(*)::text AS hitech_tiers, COALESCE(SUM(pct_less)::text,'-') AS total_pct_less
FROM public.he_vendor_rate_tier;
