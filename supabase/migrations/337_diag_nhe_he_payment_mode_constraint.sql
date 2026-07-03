-- Verify whether the migration-076 CHECK constraint on nhe_sales/he_dispatch
-- payment_mode actually exists in prod (per Fable 5 review finding #1), and
-- whether any existing rows already have a value outside Cash/Bank
-- Transfer/Cheque/UPI (which would prove the constraint isn't enforced).
SELECT rel.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname IN ('nhe_sales', 'he_dispatch') AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) ILIKE '%payment_mode%';

SELECT 'nhe_sales' AS tbl, payment_mode, COUNT(*) FROM public.nhe_sales GROUP BY payment_mode
UNION ALL
SELECT 'he_dispatch' AS tbl, payment_mode, COUNT(*) FROM public.he_dispatch GROUP BY payment_mode
ORDER BY 1, 2;
