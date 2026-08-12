-- Final verification. 630 reported:
--   open_policies_before: 125 -> guarded: 341, still_open: 0, sensitive_still_open: 0
-- which says everything is closed. But its statement 4 still printed
--   readable_without_login: 46
-- and those two cannot both be true unless one of the measures is wrong.
--
-- The suspicion: an INSERT policy has NO using clause, so pg_policies.qual is
-- NULL, and `COALESCE(qual,'true') = 'true'` counts it as unconditionally
-- readable. An INSERT policy grants no reads at all, so that metric produces a
-- false positive of exactly the number of INSERT policies. If the 46 matches
-- the INSERT count, the metric is at fault and nothing is open.
--
-- Not assuming it. Proving it.

-- 1. Does 46 equal the number of INSERT policies? If yes, 630's statement 4 was
--    measuring the wrong thing and there is no read hole.
SELECT COUNT(*) FILTER (WHERE cmd = 'INSERT') AS insert_policies,
       COUNT(*) FILTER (WHERE cmd = 'INSERT' AND qual IS NULL) AS insert_policies_with_null_qual,
       COUNT(*) FILTER (WHERE ('anon' = ANY(roles) OR 'public' = ANY(roles))
                          AND COALESCE(qual, 'true') = 'true') AS what_630_counted
FROM pg_policies WHERE schemaname = 'public';

-- 2. The honest read test: policies that actually grant SELECT (or ALL) and
--    whose USING clause does not demand a session. This is the real question —
--    an INSERT policy cannot appear here.
SELECT COUNT(*) AS genuinely_readable_without_login,
       COALESCE(string_agg(tablename || '.' || policyname, ', '), 'NONE') AS which
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('SELECT', 'ALL')
  AND COALESCE(qual, 'true') = 'true';

-- 3. The honest write test: policies granting INSERT/UPDATE/DELETE/ALL whose
--    WITH CHECK does not demand a session.
SELECT COUNT(*) AS genuinely_writable_without_login,
       COALESCE(string_agg(tablename || '.' || policyname || ' [' || cmd || ']', ', '), 'NONE') AS which
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  AND COALESCE(with_check, qual, 'true') = 'true';

-- 4. The tables that matter, one more time, by name.
SELECT COUNT(*) AS policies_on_sensitive_tables,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') LIKE '%authenticated%'
                           OR COALESCE(qual, with_check, '') LIKE '%auth.uid()%') AS guarded,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
                          AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%') AS open
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('employees','salary_monthly','bonus','partners','parties','profiles',
                    'vendor_bank_details','bank_accounts','bank_transactions','cash_book',
                    'cash_book_opening','bank_fy_opening','employee_advances','payslips',
                    'statutory_liabilities','tds_challans','supplier_invoices','party_advances');

-- 5. And the four backup tables that have RLS on but NO policy — those are not
--    a leak (no policy means no access) but they are also unreachable by the
--    app, which is worth stating rather than leaving as a loose end.
SELECT COALESCE(string_agg(t.relname, ', ' ORDER BY t.relname), 'NONE') AS rls_on_no_policy_unreachable,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS policies_total
FROM pg_class t JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relkind = 'r' AND t.relrowsecurity
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.relname);
