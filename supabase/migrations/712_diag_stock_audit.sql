-- Migration 712: verify 711 actually landed. The runner reports "already exists"
-- and "does not exist" as success, so a table or column that failed to create
-- would have shown Errors: 0 just the same.

SELECT 'tables' AS chk, string_agg(table_name, ', ' ORDER BY table_name) AS found
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('stock_audits','stock_audit_lines');

SELECT 'audit_cols' AS chk, count(*) AS n
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stock_audits';

SELECT 'line_cols' AS chk, count(*) AS n
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stock_audit_lines';

SELECT 'farm_expenses_stock_audit_id' AS chk, count(*) AS n
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'farm_expenses' AND column_name = 'stock_audit_id';

SELECT 'policies' AS chk, count(*) AS n
FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('stock_audits','stock_audit_lines');

SELECT 'del_trigger' AS chk, count(*) AS n
FROM pg_trigger WHERE tgname = 'trg_del_stock_audit';
