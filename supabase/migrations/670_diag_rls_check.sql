-- Diagnostic only. 669 reported "Errors: 0" but printed none of its verify
-- SELECTs, and green alone is not proof -- so the RLS state is read back here
-- on its own. RLS enabled with NO policy is the exact state that produced
-- "new row violates row-level security policy", so both facts are checked.
SELECT COALESCE(string_agg(c.relname || ': rls=' || c.relrowsecurity
       || ' policies=' || (SELECT COUNT(*) FROM pg_policies p
                           WHERE p.schemaname='public' AND p.tablename=c.relname), ', '), 'NONE') AS rls_state
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('cull_bird_rate','he_vendor_rate_tier');

SELECT COALESCE(string_agg(tablename || '.' || policyname || ' cmd=' || cmd, ', '), 'NO POLICIES') AS policy_detail
FROM pg_policies WHERE schemaname='public' AND tablename IN ('cull_bird_rate','he_vendor_rate_tier');

SELECT COALESCE(string_agg(tbl, ', ' ORDER BY tbl), 'NONE - all fine') AS any_table_rls_on_but_no_policy
FROM (SELECT c.relname AS tbl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity
        AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname)) x;

SELECT COUNT(*)::text AS hitech_tiers FROM public.he_vendor_rate_tier;
