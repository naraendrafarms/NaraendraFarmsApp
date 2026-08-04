-- Adds a Free Qty column to NHE egg sale lines, so eggs given away free
-- (complimentary / to outsiders) can be recorded properly instead of being
-- faked as a zero-rate sale. Mirrors how HE Dispatch already handles this
-- with its free_eggs column: free eggs still COUNT as eggs leaving stock
-- (so Egg Stock / production reports stay right) but are EXCLUDED from the
-- billed amount, and can now be totalled separately in reports.
ALTER TABLE public.nhe_sale_lines ADD COLUMN IF NOT EXISTS free_qty NUMERIC(12,2) DEFAULT 0;

-- Header-level total so list views / exports don't have to join lines just
-- to show "how many free eggs were on this sale".
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS free_qty NUMERIC(12,2) DEFAULT 0;

-- Verify both columns exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('nhe_sale_lines', 'nhe_sales')
  AND column_name = 'free_qty'
ORDER BY table_name;

SELECT 'sentinel' AS marker, 1 AS n;
