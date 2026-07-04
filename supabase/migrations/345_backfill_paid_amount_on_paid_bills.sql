-- Bills marked Paid via the Edit form's Status dropdown or the bulk Mark
-- Paid in Payment Planning had only the status FLAG flipped - paid_amount
-- stayed 0/NULL, so the list showed Status "Paid" alongside a blank Paid
-- column and a leftover Balance. Backfill the settled amount for those
-- rows (net payable minus any recorded discount). Rows with a real partial
-- paid_amount are untouched.
SELECT COUNT(*) AS paid_flag_without_amount_before
FROM public.pending_payments
WHERE payment_status = 'Paid' AND COALESCE(paid_amount, 0) = 0
  AND COALESCE(net_payable, invoice_amount, 0) > 0;

UPDATE public.pending_payments
SET paid_amount = GREATEST(0, COALESCE(net_payable, invoice_amount, 0) - COALESCE(discount_amount, 0))
WHERE payment_status = 'Paid' AND COALESCE(paid_amount, 0) = 0
  AND COALESCE(net_payable, invoice_amount, 0) > 0;

SELECT COUNT(*) AS paid_flag_without_amount_after
FROM public.pending_payments
WHERE payment_status = 'Paid' AND COALESCE(paid_amount, 0) = 0
  AND COALESCE(net_payable, invoice_amount, 0) > 0;
