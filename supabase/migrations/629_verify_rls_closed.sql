-- Verification for 628. Two things in its output need resolving before the
-- job can be called done, and neither should be assumed:
--
--   policies_to_tighten: 35   — but 627 counted 72. 628's predicate required
--     BOTH qual and with_check to be unconditional; 627's required only qual.
--     So are there policies left whose USING is `true` while their WITH CHECK
--     is something else? Those would still allow reads without a login.
--
--   still_not_requiring_login: 5  (on the seven sensitive tables)
--     Likely the auth.uid() policies — `id = auth.uid()`, `sender_id =
--     auth.uid()` — which ARE secure but do not contain the word
--     "authenticated", so 628's text match would not count them. Likely is not
--     the same as verified. Print them.

-- 1. 627's exact predicate, re-run: anything readable with no login.
SELECT COUNT(*) AS readable_without_login,
       COALESCE(string_agg(DISTINCT tablename, ', ' ORDER BY tablename), 'NONE') AS tables_still_readable
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  AND COALESCE(qual, 'true') = 'true';

-- 2. And the write side: anything writable with no login.
SELECT COUNT(*) AS writable_without_login,
       COALESCE(string_agg(DISTINCT tablename || '.' || policyname || ' [' || cmd || ']', ', '), 'NONE') AS still_writable
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  AND COALESCE(with_check, 'true') = 'true'
  AND COALESCE(qual, 'true') = 'true';

-- 3. The 5 on sensitive tables that do not say "authenticated" — printed in
--    full so each can be judged rather than assumed benign.
SELECT COALESCE(string_agg(tablename || '.' || policyname || ' [' || cmd || '] ' ||
                           COALESCE(qual, with_check, '(none)'), ' | '), 'NONE') AS sensitive_policies_without_authenticated
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('employees','salary_monthly','bonus','partners','parties',
                    'profiles','vendor_bank_details')
  AND COALESCE(qual, with_check, '') NOT LIKE '%authenticated%';

-- 4. Whole-database summary on the only measure that matters: a policy is safe
--    if it demands a session (authenticated) or ties rows to the caller
--    (auth.uid()). Anything else is open.
SELECT COUNT(*) AS policies_total,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') LIKE '%authenticated%'
                           OR COALESCE(qual, with_check, '') LIKE '%auth.uid()%') AS safe_policies,
       COUNT(*) FILTER (WHERE COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
                          AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%') AS open_policies
FROM pg_policies WHERE schemaname = 'public';

-- 5. Name whatever is still open, if anything, so nothing is left unstated.
SELECT COALESCE(string_agg(tablename || '.' || policyname || ' [' || cmd || ']', ' | ' ORDER BY tablename), 'NONE — everything requires a session') AS remaining_open
FROM pg_policies
WHERE schemaname = 'public'
  AND COALESCE(qual, with_check, '') NOT LIKE '%authenticated%'
  AND COALESCE(qual, with_check, '') NOT LIKE '%auth.uid()%';
