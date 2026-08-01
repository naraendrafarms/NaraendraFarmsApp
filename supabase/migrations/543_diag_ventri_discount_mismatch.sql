-- Diagnostic only (no schema changes) — user paid Rs 4,80,454 (after a
-- discount) to Ventri Biologicals for Inv 27SLHYD21/203 / GRN 2665 via
-- CMS/NEFT (ref CMS1272699630807, 2026-05-07), but the Bank Ledger row
-- shows the full Rs 4,95,313.00 instead of the actual amount paid.
-- Checking the underlying pending_payments bill (net_payable, discount,
-- paid_amount) and the bank_transactions row itself (imported amount vs
-- linked bill) to see where the full amount is coming from.
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount, payment_status, transaction_ref
FROM public.pending_payments
WHERE invoice_no ILIKE '%27SLHYD21/203%' OR grn_no ILIKE '%2665%' OR vendor_name ILIKE '%Ventri%';

SELECT id, txn_date, txn_type, category, reference_no, description, amount, party_id, linked_payment_id, match_status
FROM public.bank_transactions
WHERE reference_no ILIKE '%CMS1272699630807%' OR description ILIKE '%Ventri%2665%' OR description ILIKE '%27SLHYD21%';

SELECT 'sentinel' AS marker, 1 AS n;
