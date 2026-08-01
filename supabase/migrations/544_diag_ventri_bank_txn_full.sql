-- Diagnostic only (no schema changes) — 543's pending_payments query
-- returned ZERO rows for Ventri/27SLHYD21/203/GRN 2665 (no bill exists
-- at all matching that vendor/invoice/GRN), yet the bank_transactions
-- row for this CMS payment clearly exists with the description text.
-- That means this bank transaction may never have been linked to a real
-- pending_payments bill — possibly a plain manually-entered/imported
-- transaction with no linked_payment_id, and its `amount` came from
-- wherever created it (CMS Upload?) using the gross invoice figure
-- instead of the net-after-discount figure actually transferred.
-- Getting the FULL row (543's version got cut mid-JSON) plus checking if
-- a pending_payments bill for Ventri exists under ANY invoice/GRN number.
SELECT id, txn_date, txn_type, category, reference_no, description, amount,
  party_id, linked_payment_id, match_status
FROM public.bank_transactions
WHERE description ILIKE '%2665%' AND description ILIKE '%Ventri%';

SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount, payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%Ventri%'
ORDER BY invoice_date DESC
LIMIT 15;

SELECT 'sentinel' AS marker, 1 AS n;
