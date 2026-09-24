-- Supabase stops automatically granting Data API access to NEW tables in the
-- public schema from 30 October. Existing tables keep what they have, so
-- nothing about the live app changes today.
--
-- WHY THIS MIGRATION EXISTS AT ALL, since it is a no-op against the live
-- database: our 130-odd CREATE TABLE migrations never granted anything - they
-- relied on the automatic grant. Replaying them into a fresh project, a
-- preview branch or a local `supabase db reset` would therefore build a
-- database the app cannot read. This puts the grants in the repo so a rebuild
-- produces a working database instead of a silent one.
--
-- MEASURED FIRST (1356, read only, Errors: 0): 185 tables, ALL with RLS
-- enabled, all already carrying SELECT for both `authenticated` AND `anon`;
-- 14 views likewise. So this adds nothing live - it only writes down what is
-- already true.
--
-- WHY anon IS INCLUDED: it already holds SELECT on all 185. The protection
-- comes from the RLS policies, which are TO authenticated - a grant lets a
-- role touch the table, the policy decides which rows it sees, and anon sees
-- none. Leaving anon out would make new tables behave unlike every existing
-- one, which is a worse trap than the grant.
--
-- SAFE BY CONSTRUCTION: GRANT only adds. It cannot revoke a privilege, cannot
-- touch a row, and re-running it changes nothing.

DO $$
DECLARE r RECORD; n_tab INT := 0; n_view INT := 0; n_seq INT := 0;
BEGIN
  -- Tables. Every one has RLS on, so a grant still cannot read a row the
  -- policy does not allow; a backup table with RLS and no policy stays
  -- deny-all to everyone but the service role.
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
            WHERE ns.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated, service_role', r.relname);
    n_tab := n_tab + 1;
  END LOOP;

  -- Views are read through the Data API too - v_flock_summary and friends.
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
            WHERE ns.nspname = 'public' AND c.relkind = 'v'
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated, service_role', r.relname);
    n_view := n_view + 1;
  END LOOP;

  -- Sequences: a table with a serial id cannot be INSERTed into without USAGE
  -- on its sequence, so a grant on the table alone would still fail on save.
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
            WHERE ns.nspname = 'public' AND c.relkind = 'S'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO anon, authenticated, service_role', r.relname);
    n_seq := n_seq + 1;
  END LOOP;

  RAISE NOTICE 'granted: % tables, % views, % sequences', n_tab, n_view, n_seq;
END
$$;

-- Verify from the catalogue rather than from the notice, which the runner does
-- not capture: every table and view readable by both roles, and writable by
-- authenticated.
SELECT 'tables=' || COUNT(*)
    || ' anonSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('anon', c.oid, 'SELECT'))
    || ' authSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('authenticated', c.oid, 'SELECT'))
    || ' authInsert=' || COUNT(*) FILTER (WHERE has_table_privilege('authenticated', c.oid, 'INSERT'))
    || ' authDelete=' || COUNT(*) FILTER (WHERE has_table_privilege('authenticated', c.oid, 'DELETE'))
    || ' svcSelect='  || COUNT(*) FILTER (WHERE has_table_privilege('service_role', c.oid, 'SELECT'))
    AS table_grants
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
 WHERE ns.nspname = 'public' AND c.relkind = 'r';

SELECT 'views=' || COUNT(*)
    || ' anonSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('anon', c.oid, 'SELECT'))
    || ' authSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('authenticated', c.oid, 'SELECT'))
    AS view_grants
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
 WHERE ns.nspname = 'public' AND c.relkind = 'v';
