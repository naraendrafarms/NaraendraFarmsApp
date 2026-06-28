-- Migration 195: Audit RLS + grants across all public tables (read-only).
-- Finds tables the app (authenticated role) cannot read/write, like stock_ledger was.

-- A. RLS ENABLED but NO policy → blocks ALL access (silent empty pages)
SELECT 'A_rls_no_policy' AS chk, c.relname AS table_name
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity = true
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename = c.relname)
ORDER BY c.relname;

-- B. No SELECT grant for authenticated → app cannot read
SELECT 'B_no_select_grant' AS chk, t.tablename AS table_name
FROM pg_tables t
WHERE t.schemaname='public'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema='public' AND g.table_name=t.tablename
      AND g.grantee='authenticated' AND g.privilege_type='SELECT')
ORDER BY t.tablename;

-- C. No INSERT grant for authenticated → app cannot write
SELECT 'C_no_insert_grant' AS chk, t.tablename AS table_name
FROM pg_tables t
WHERE t.schemaname='public'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema='public' AND g.table_name=t.tablename
      AND g.grantee='authenticated' AND g.privilege_type='INSERT')
ORDER BY t.tablename;
