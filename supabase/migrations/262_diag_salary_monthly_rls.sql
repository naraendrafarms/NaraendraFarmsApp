-- Diagnostic only (SELECT), no data changes. Salary Register shows "No
-- salary data" for June 2026 in the app even though raw SQL (service role,
-- bypasses RLS) confirms 207 real rows exist. Check RLS policies on
-- salary_monthly and employees — a policy scoping by farm/role could be
-- silently hiding rows from the logged-in user without any error.
SELECT 'salary_monthly_rls_enabled' AS chk, relrowsecurity FROM pg_class WHERE relname='salary_monthly';
SELECT 'employees_rls_enabled' AS chk, relrowsecurity FROM pg_class WHERE relname='employees';

SELECT 'policy' AS chk, tablename, policyname, cmd, roles, qual
FROM pg_policies WHERE tablename IN ('salary_monthly','employees')
ORDER BY tablename, policyname;
