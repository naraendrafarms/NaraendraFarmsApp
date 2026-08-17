-- Migration 713: statement 6 of 712 printed nothing, so the delete trigger from
-- 711 is unconfirmed. Ask again on its own.

SELECT 'del_trigger' AS chk, count(*)::int AS n
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE t.tgname = 'trg_del_stock_audit' AND c.relname = 'stock_audits';
