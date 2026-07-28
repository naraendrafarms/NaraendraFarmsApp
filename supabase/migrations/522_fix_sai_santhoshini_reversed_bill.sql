-- Data fix: Sai Santhoshini Traders bill (invoice 3034, GRN 2430) was
-- reversed from Paid back to Pending, but paid_amount (376402) was never
-- cleared — the Edit form's Status dropdown didn't reset it (now fixed in
-- code), leaving Balance at 0/settled and hiding the Pay button even
-- though the bill is meant to be outstanding again.
UPDATE public.pending_payments
SET paid_amount = 0, discount_amount = 0
WHERE invoice_no = '3034' AND grn_no = '2430' AND invoice_amount = 376402 AND payment_status <> 'Paid';

SELECT 'sentinel' AS marker, 1 AS n;
SELECT id, invoice_no, grn_no, invoice_amount, net_payable, paid_amount, discount_amount, payment_status
FROM public.pending_payments WHERE invoice_no = '3034' AND grn_no = '2430';
