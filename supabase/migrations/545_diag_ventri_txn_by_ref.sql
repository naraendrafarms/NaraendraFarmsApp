-- Diagnostic only (no schema changes) — 544 found NO pending_payments bill
-- for Ventri Biologicals at all matching invoice 27SLHYD21/203 or GRN 2665
-- (the vendor's 5 real bills on file are /453, /299, and others — /203
-- isn't among them), and the description-based search for that bank
-- transaction also returned 0 rows. Pulling the exact 2026-05-07 CMS
-- transaction by reference_no + date to see its real description/amount.
SELECT id, txn_date, txn_type, category, reference_no, description, amount,
  party_id, linked_payment_id, match_status
FROM public.bank_transactions
WHERE reference_no = 'CMS1272699630807' AND txn_date = '2026-05-07';

SELECT 'sentinel' AS marker, 1 AS n;
