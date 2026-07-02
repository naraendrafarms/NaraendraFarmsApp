-- Diagnostic only — verify migration 234 created the table correctly
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='statutory_liabilities'
ORDER BY ordinal_position;
