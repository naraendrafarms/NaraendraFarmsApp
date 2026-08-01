-- Diagnostic only (no schema changes) — 545 found the bank_transactions
-- row IS linked (linked_payment_id = 536d6e05-112f-48dd-9e2d-4f6ccd0187fa),
-- amount=495313.00 (the gross invoice figure), match_status='manual'.
-- Checking that linked pending_payments bill's own net_payable/discount/
-- paid_amount to see whether the ₹14,859 discount (495313-480454) was ever
-- recorded on the bill itself, and whether paid_amount matches what was
-- actually transferred (480454) or the full gross amount.
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount, payment_status, transaction_ref
FROM public.pending_payments
WHERE id = '536d6e05-112f-48dd-9e2d-4f6ccd0187fa';

SELECT 'sentinel' AS marker, 1 AS n;
