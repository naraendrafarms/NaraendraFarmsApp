-- Migration 084: DIAGNOSTIC ONLY — read counts from job log "OK rows=N"
-- Each SELECT returns N rows so run_sql.py prints "OK rows=N".

-- (1) Does FK constraint fk_cash_book_nhe_sale exist? rows=1 if yes, rows=0 if no
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'fk_cash_book_nhe_sale' AND table_name = 'cash_book';

-- (2) Does column nhe_sale_id exist? rows=1 if yes
SELECT 1 FROM information_schema.columns
WHERE table_name = 'cash_book' AND column_name = 'nhe_sale_id';

-- (3) Total cash_book receipt rows (cash). rows = total count
SELECT 1 FROM public.cash_book WHERE txn_type = 'receipt' AND payment_mode = 'cash';

-- (4) cash_book receipt rows WITH nhe_sale_id linked. rows = linked count
SELECT 1 FROM public.cash_book WHERE txn_type = 'receipt' AND payment_mode = 'cash' AND nhe_sale_id IS NOT NULL;

-- (5) cash_book receipt rows UNLINKED (nhe_sale_id NULL AND he_dispatch_id NULL). rows = orphan count
SELECT 1 FROM public.cash_book WHERE txn_type = 'receipt' AND payment_mode = 'cash' AND nhe_sale_id IS NULL AND he_dispatch_id IS NULL;
