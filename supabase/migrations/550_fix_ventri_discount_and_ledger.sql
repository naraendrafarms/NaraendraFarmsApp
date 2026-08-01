-- Fixes the Ventri Biologicals bill (Inv 27SLHYD21/203, GRN 2665) that the
-- user paid ₹4,80,454 after a ₹14,859 discount, but which shows the full
-- ₹4,95,313 in Bank Ledger/Cash Book. Root cause (see PendingPaymentsPage.tsx
-- handleEditSave): re-posting the ledger entry for an already-Paid bill used
-- the gross net_payable figure instead of the actual Paid Amount field —
-- fixed in code this session. This migration corrects the existing data:
-- records the discount explicitly (so the bill's own balance clears to
-- zero) and corrects the already-posted cash_book/bank_transactions rows
-- to the real ₹4,80,454 actually transferred.
-- Matched by stable natural keys (vendor + invoice/GRN), not a copied id,
-- since this bill's linked ledger rows get replaced (delete+repost) on
-- every edit and a hand-copied id can go stale between queries.

UPDATE public.pending_payments
SET discount_amount = 14859.00,
    paid_amount = 480454.00
WHERE vendor_name ILIKE '%Ventri%' AND invoice_no = '27SLHYD21/203' AND grn_no = '2665';

UPDATE public.cash_book
SET amount_out = 480454.00
WHERE pending_payment_id IN (
  SELECT id FROM public.pending_payments
  WHERE vendor_name ILIKE '%Ventri%' AND invoice_no = '27SLHYD21/203' AND grn_no = '2665'
) AND amount_out = 495313.00;

UPDATE public.bank_transactions
SET amount = 480454.00
WHERE linked_payment_id IN (
  SELECT id FROM public.pending_payments
  WHERE vendor_name ILIKE '%Ventri%' AND invoice_no = '27SLHYD21/203' AND grn_no = '2665'
) AND amount = 495313.00;

-- Verify: balance should be 0, payment_status Paid, ledger rows show 480454
SELECT id, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount,
  (COALESCE(net_payable, invoice_amount, 0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) AS balance,
  payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%Ventri%' AND invoice_no = '27SLHYD21/203' AND grn_no = '2665';

SELECT 'sentinel' AS marker, 1 AS n;
