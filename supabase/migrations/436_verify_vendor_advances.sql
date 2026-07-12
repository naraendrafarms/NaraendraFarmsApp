-- Migration 434's own verification SELECTs never printed in the log
-- (truncation, not necessarily failure) — verify directly as the first
-- statements here.
SELECT count(*) AS table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='vendor_advances';

SELECT count(*) AS pending_payments_cols FROM information_schema.columns
WHERE table_schema='public' AND table_name='pending_payments'
  AND column_name IN ('advance_adjusted','vendor_advance_id');

SELECT count(*) AS policy_count FROM pg_policy WHERE polrelid = 'public.vendor_advances'::regclass;

INSERT INTO vendor_advances (advance_date, party_id, amount, payment_mode)
SELECT '2026-01-01', id, 1.00, 'cash' FROM parties LIMIT 1;
SELECT count(*) AS test_row_exists FROM vendor_advances WHERE amount = 1.00 AND advance_date = '2026-01-01';
DELETE FROM vendor_advances WHERE amount = 1.00 AND advance_date = '2026-01-01';
