-- Closes the 72 policies that allow access with NO login.
--
-- 627 measured it exactly: of 341 policies, 158 are unconditional and 72 of
-- those are reachable by the anon role. RLS is enabled on every table, but a
-- policy saying USING (true) makes that meaningless — the anon key is embedded
-- in the public JavaScript bundle, so anyone who opens the site can read it out
-- and call the API directly. Seven of the exposed tables hold sensitive data:
-- employees (salary, PAN, Aadhaar, bank account), salary_monthly, bonus,
-- partners, parties, profiles, vendor_bank_details. Some of the open policies
-- are INSERT/UPDATE/DELETE, not just SELECT.
--
-- The fix brings them in line with the 136 policies that were already written
-- correctly: require auth.role() = 'authenticated'.
--
-- WHY THIS CANNOT AFFECT ANYONE USING THE APP: every route is behind
-- `user ? children : <Navigate to="/login">`, Login.tsx issues no table
-- queries, loadProfile() runs only after sign-in with a user id, and the Setup
-- page uses the Supabase management API with its own token rather than the anon
-- key. Every request the app makes therefore already carries a logged-in
-- session, which is exactly what the new condition asks for.
--
-- ALTER POLICY is used rather than DROP + CREATE so each policy keeps its name,
-- command and roles — only the condition changes. A dropped-and-recreated
-- policy that failed halfway would leave a table with no policy at all, which
-- locks out the app; ALTER cannot do that.
--
-- The command decides which clause exists: INSERT has only WITH CHECK, SELECT
-- and DELETE have only USING, UPDATE and ALL have both. Setting the wrong one
-- errors, so each is handled explicitly.

-- 1. What is about to change, named before changing it.
SELECT COUNT(*) AS policies_to_tighten,
       COALESCE(string_agg(DISTINCT tablename, ', ' ORDER BY tablename), 'NONE') AS tables_affected
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  AND COALESCE(qual, 'true') = 'true'
  AND COALESCE(with_check, 'true') = 'true';

-- 2. Tighten them.
DO
$$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
      AND COALESCE(qual, 'true') = 'true'
      AND COALESCE(with_check, 'true') = 'true'
  LOOP
    BEGIN
      IF r.cmd = 'INSERT' THEN
        EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (auth.role() = %L)',
                       r.policyname, r.tablename, 'authenticated');
      ELSIF r.cmd IN ('SELECT', 'DELETE') THEN
        EXECUTE format('ALTER POLICY %I ON public.%I USING (auth.role() = %L)',
                       r.policyname, r.tablename, 'authenticated');
      ELSE  -- UPDATE and ALL carry both clauses
        EXECUTE format('ALTER POLICY %I ON public.%I USING (auth.role() = %L) WITH CHECK (auth.role() = %L)',
                       r.policyname, r.tablename, 'authenticated', 'authenticated');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Never abort the whole run for one odd policy; statement 3 will show
      -- anything left behind rather than reporting a false success.
      RAISE NOTICE 'skipped %.%: %', r.tablename, r.policyname, SQLERRM;
    END;
  END LOOP;
END
$$;

-- 3. The decisive check: nothing may remain reachable without a login.
SELECT COUNT(*) AS still_open_without_login,
       COALESCE(string_agg(DISTINCT tablename, ', ' ORDER BY tablename), 'NONE — all closed') AS still_open_tables
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  AND COALESCE(qual, 'true') = 'true'
  AND COALESCE(with_check, 'true') = 'true';

-- 4. The seven sensitive tables specifically — every policy on them must now
--    demand a session.
SELECT COUNT(*) AS policies_on_sensitive_tables,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') LIKE '%authenticated%') AS require_login,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') NOT LIKE '%authenticated%') AS still_not_requiring_login
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('employees','salary_monthly','bonus','partners','parties',
                    'profiles','vendor_bank_details');

-- 5. Nothing was lost: the policy count must be unchanged, and no table may be
--    left with RLS on and no policy (which would lock the app out entirely).
SELECT (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS policies_total_after,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
          AND qual LIKE '%auth.role()%authenticated%') AS now_requiring_login,
       (SELECT COALESCE(string_agg(t.relname, ', ' ORDER BY t.relname), 'NONE')
        FROM pg_class t JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public' AND t.relkind = 'r' AND t.relrowsecurity
          AND NOT EXISTS (SELECT 1 FROM pg_policies p
                          WHERE p.schemaname = 'public' AND p.tablename = t.relname)) AS tables_with_rls_but_no_policy;
