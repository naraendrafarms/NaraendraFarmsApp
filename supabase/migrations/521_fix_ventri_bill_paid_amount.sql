-- Data fix: Ventri Biologicals Division bill (invoice 27SLHYD21/16, GRN
-- 2653) had paid_amount silently overwritten to 70818 by the Edit form's
-- now-fixed auto-recalculation bug (Net Payable - whatever discount was in
-- the form at save time, which briefly held a wrong value). User confirmed
-- the actual intent: Discount 2260, Paid 73078 (Net Payable 75338 - 2260).
UPDATE public.pending_payments
SET paid_amount = 73078, discount_amount = 2260
WHERE invoice_no = '27SLHYD21/16' AND grn_no = '2653' AND invoice_amount = 75338;

SELECT 'sentinel' AS marker, 1 AS n;
SELECT id, invoice_no, grn_no, invoice_amount, net_payable, paid_amount, discount_amount, payment_status
FROM public.pending_payments WHERE invoice_no = '27SLHYD21/16' AND grn_no = '2653';
