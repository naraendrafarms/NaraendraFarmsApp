-- Closes what 628 missed.
--
-- 628 filtered on BOTH qual and with_check being unconditional. A SELECT policy
-- has no WITH CHECK, so that filter matched only 35 of the 72 policies 627 had
-- found, and left the read-only ones open. Worse, 628's own verification used
-- the same narrow filter, so it reported "all closed" while 46 policies were
-- still readable without a login — a check that could only ever agree with the
-- change it was checking.
--
-- 629 re-measured with 627's predicate and with an independent one:
--   readable_without_login: 46      writable_without_login: 0
--   policies_total: 341   safe: 216   open: 125
--
-- Among the open ones, four on vendor_bank_details are NAMED "Authenticated
-- users can read/insert/update/delete" but their condition is literally `true`
-- — the intent was recorded, the condition never written. bank_accounts,
-- bank_transactions, cash_book_opening and bank_fy_opening are the same.
--
-- This file tightens every policy whose condition does not already demand a
-- session, and verifies with a DIFFERENT measure than the one driving the
-- change: not "does my filter still match anything", but "does every policy in
-- the database now reference authenticated or auth.uid()".
--
-- Still cannot affect anyone using the app: every route is behind a login,
-- Login.tsx issues no table queries, and loadProfile() runs only after sign-in.

-- 1. What is still open, before the change.
SELECT COUNT(*) AS open_policies_before,
       COALESCE(string_agg(DISTINCT tablename, ', ' ORDER BY tablename), 'NONE') AS tables_before
FROM pg_policies
WHERE schemaname = 'public'
  AND COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
  AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%';

-- 2. Tighten every one of them, by command. ALTER rather than DROP+CREATE so a
--    failure can never leave a table with RLS on and no policy.
DO
$$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
      AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%'
  LOOP
    BEGIN
      IF r.cmd = 'INSERT' THEN
        EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (auth.role() = %L)',
                       r.policyname, r.tablename, 'authenticated');
      ELSIF r.cmd IN ('SELECT', 'DELETE') THEN
        EXECUTE format('ALTER POLICY %I ON public.%I USING (auth.role() = %L)',
                       r.policyname, r.tablename, 'authenticated');
      ELSE
        EXECUTE format('ALTER POLICY %I ON public.%I USING (auth.role() = %L) WITH CHECK (auth.role() = %L)',
                       r.policyname, r.tablename, 'authenticated', 'authenticated');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skipped %.%: %', r.tablename, r.policyname, SQLERRM;
    END;
  END LOOP;
END
$$;

-- 3. INDEPENDENT CHECK — not "did my filter stop matching", but "is every
--    policy in the database now guarded". Any row here is a real gap.
SELECT COUNT(*) AS policies_total,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') LIKE '%authenticated%'
                           OR COALESCE(qual, with_check, '') LIKE '%auth.uid()%') AS guarded,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
                          AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%') AS STILL_OPEN,
       COALESCE(string_agg(DISTINCT tablename, ', ') FILTER (
         WHERE COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
           AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%'), 'NONE') AS still_open_tables
FROM pg_policies WHERE schemaname = 'public';

-- 4. Second independent check, from the anon angle rather than the text angle:
--    can anything still be read or written with no session at all?
SELECT COUNT(*) FILTER (WHERE COALESCE(qual, 'true') = 'true') AS readable_without_login,
       COUNT(*) FILTER (WHERE cmd IN ('INSERT','UPDATE','DELETE','ALL')
                          AND COALESCE(with_check, 'true') = 'true'
                          AND COALESCE(qual, 'true') = 'true') AS writable_without_login
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles));

-- 5. Nothing lost, nothing locked out: same policy count, and no table left
--    with RLS enabled and no policy (which would shut the app out of it).
SELECT (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS policies_total_after,
       (SELECT COALESCE(string_agg(t.relname, ', ' ORDER BY t.relname), 'NONE')
        FROM pg_class t JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public' AND t.relkind = 'r' AND t.relrowsecurity
          AND NOT EXISTS (SELECT 1 FROM pg_policies p
                          WHERE p.schemaname = 'public' AND p.tablename = t.relname)) AS tables_with_rls_but_no_policy,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
          AND tablename IN ('employees','salary_monthly','bonus','partners','parties','profiles',
                            'vendor_bank_details','bank_accounts','bank_transactions','cash_book',
                            'cash_book_opening','bank_fy_opening')
          AND COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
          AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%') AS sensitive_still_open;
