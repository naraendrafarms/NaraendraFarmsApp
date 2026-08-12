-- Follow-up to 626, which was not precise enough to answer the question.
--
-- 626 reported "209 policies open to anon or public". That over-states it:
-- pg_policies.roles shows {public} for ANY policy written without an explicit
-- TO clause, which is how every policy in this app is written. So roles alone
-- proves nothing — the USING condition is what decides. A policy
--   TO public USING (auth.role() = 'authenticated')
-- is NOT open: the condition still demands a logged-in session.
--
-- The dangerous combination is a policy reachable by the ANON role whose
-- condition is literally TRUE. 626 found 158 policies with condition `true`.
-- Whether those are reachable without logging in is the actual question, and
-- this file answers it exactly rather than by inference.

-- 1. The precise count: policies whose condition is unconditionally true AND
--    which the anon role can use.
SELECT COUNT(*) AS policies_total,
       COUNT(*) FILTER (WHERE COALESCE(qual, 'true') = 'true'
                          AND COALESCE(with_check, 'true') = 'true') AS unconditional_policies,
       COUNT(*) FILTER (WHERE ('anon' = ANY(roles) OR 'public' = ANY(roles))
                          AND COALESCE(qual, 'true') = 'true') AS anon_reachable_and_unconditional
FROM pg_policies WHERE schemaname = 'public';

-- 2. Name the tables where an unconditional policy is reachable by anon —
--    these are readable/writable by anyone holding the public key.
SELECT COALESCE(string_agg(DISTINCT tablename, ', ' ORDER BY tablename), 'NONE') AS tables_truly_open
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  AND COALESCE(qual, 'true') = 'true';

-- 3. How many of those hold sensitive data — payroll, banking, identity.
SELECT COUNT(DISTINCT tablename) AS sensitive_tables_open,
       COALESCE(string_agg(DISTINCT tablename, ', ' ORDER BY tablename), 'NONE') AS which_ones
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  AND COALESCE(qual, 'true') = 'true'
  AND tablename IN ('employees','salary_monthly','employee_advances','employee_deductions',
                    'bank_accounts','bank_transactions','cash_book','payslips','profiles',
                    'partners','parties','statutory_liabilities','tds_challans','company_settings',
                    'vendor_bank_details','party_advances','supplier_invoices','bonus');

-- 4. The command per open policy, so each can be judged rather than guessed at.
--    Capped for legibility.
SELECT COALESCE(string_agg(tablename || '.' || policyname || ' [' || cmd || ']', ' | '), 'NONE') AS open_policy_detail
FROM (
  SELECT tablename, policyname, cmd FROM pg_policies
  WHERE schemaname = 'public'
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
    AND COALESCE(qual, 'true') = 'true'
  ORDER BY tablename, policyname LIMIT 20
) x;

-- 5. For contrast: the properly-guarded ones, so the split is clear.
SELECT COUNT(*) AS policies_requiring_login
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.role()%authenticated%';
