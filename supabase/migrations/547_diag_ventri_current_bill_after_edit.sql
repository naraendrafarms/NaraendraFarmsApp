-- Diagnostic only (no schema changes) — user says they edited Paid Amount
-- to 480454 in Pending Payments for this Ventri bill, and it now shows a
-- "balance" equal to the discount (~14,859) rather than being fully
-- settled — confirming discount_amount was never entered, just paid_amount
-- reduced. Finding the CURRENT bill (546 showed the original linked id
-- 536d6e05 no longer exists) to see its live net_payable/paid_amount/
-- discount_amount/balance right now.
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount,
  (COALESCE(net_payable, invoice_amount, 0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) AS balance,
  payment_status, transaction_ref
FROM public.pending_payments
WHERE invoice_no ILIKE '%27SLHYD21%203%' OR grn_no = '2665' OR (vendor_name ILIKE '%Ventri%' AND paid_amount = 480454);

SELECT 'sentinel' AS marker, 1 AS n;
