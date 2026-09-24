-- READ ONLY. No INSERT, UPDATE, DELETE or DDL. Nothing is written.
-- Before backfilling Data API grants: which public tables have RLS on, which
-- do not, and which already carry a grant for `authenticated`? A blanket grant
-- would expose the RLS-less backup tables to every logged-in user through
-- PostgREST, so the two sets have to be told apart first.

SELECT 'tables=' || COUNT(*)
    || ' rlsOn=' || COUNT(*) FILTER (WHERE c.relrowsecurity)
    || ' rlsOff=' || COUNT(*) FILTER (WHERE NOT c.relrowsecurity)
    || ' authHasSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('authenticated', c.oid, 'SELECT'))
    || ' authNoSelect=' || COUNT(*) FILTER (WHERE NOT has_table_privilege('authenticated', c.oid, 'SELECT'))
    || ' anonHasSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('anon', c.oid, 'SELECT'))
    AS grant_state
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r';

-- The RLS-OFF tables, named. These are the ones a blanket grant would open up.
SELECT 'rlsOff: ' || COALESCE(string_agg(c.relname, ', ' ORDER BY c.relname), 'none') AS rls_off_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

-- Views matter too: PostgREST reads v_flock_summary and friends.
SELECT 'views=' || COUNT(*)
    || ' authHasSelect=' || COUNT(*) FILTER (WHERE has_table_privilege('authenticated', c.oid, 'SELECT'))
    || ' authNoSelect=' || COUNT(*) FILTER (WHERE NOT has_table_privilege('authenticated', c.oid, 'SELECT'))
    AS view_state
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'v';
