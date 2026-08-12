-- Diagnostic only (no schema changes, no data changes).
--
-- "Are the tables publicly accessible?" The Supabase anon key is embedded in
-- the frontend bundle, so anyone who opens the site has it. What stops a
-- stranger reading payroll or bank transactions with that key is ROW LEVEL
-- SECURITY plus the policies on each table:
--
--   * RLS disabled            -> the anon key can read AND write the table.
--   * RLS enabled, no policy  -> nobody can read it (not even the app).
--   * policy USING auth.role()='authenticated' -> any LOGGED-IN user, of any
--     app role, can do what the policy allows. Not public, but not restricted
--     between users either.
--   * a policy granted TO anon / TO public -> readable without logging in.
--
-- Read the live catalogue rather than the migration files: a later migration
-- creating a table without RLS would not show up in a grep of the earlier ones.

-- 1. The headline: how many tables, and how many have RLS switched on.
SELECT COUNT(*) AS tables_total,
       COUNT(*) FILTER (WHERE c.relrowsecurity) AS rls_enabled,
       COUNT(*) FILTER (WHERE NOT c.relrowsecurity) AS rls_DISABLED_readable_by_anon
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';

-- 2. Name every table WITHOUT RLS — these are the exposed ones, if any.
SELECT COALESCE(string_agg(c.relname, ', ' ORDER BY c.relname), 'NONE — every table has RLS on') AS tables_without_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

-- 3. RLS on but NO policy at all = locked to everyone, including the app.
--    Worth knowing: a page reading such a table silently returns nothing.
SELECT COALESCE(string_agg(t.relname, ', ' ORDER BY t.relname), 'NONE') AS rls_on_but_no_policy
FROM pg_class t JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relkind = 'r' AND t.relrowsecurity
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.relname);

-- 4. Any policy that reaches ANON or PUBLIC — i.e. genuinely open to the
--    internet without logging in. This is the question actually being asked.
SELECT COUNT(*) AS policies_total,
       COUNT(*) FILTER (WHERE 'anon' = ANY(roles) OR 'public' = ANY(roles)) AS policies_open_to_anon_or_public,
       COALESCE(string_agg(DISTINCT tablename, ', ')
                FILTER (WHERE 'anon' = ANY(roles) OR 'public' = ANY(roles)), 'NONE') AS tables_open_without_login
FROM pg_policies WHERE schemaname = 'public';

-- 5. What the policies actually say, grouped — so the pattern is visible
--    rather than described. Expect the bulk to be auth.role()='authenticated'.
SELECT COALESCE(string_agg(expr || ' -> ' || n || ' policies', ' | ' ORDER BY n DESC), 'NONE') AS policy_shapes
FROM (
  SELECT COALESCE(qual, with_check, '(no condition)') AS expr, COUNT(*) AS n
  FROM pg_policies WHERE schemaname = 'public'
  GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 8
) x;
