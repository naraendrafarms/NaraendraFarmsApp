-- Fixes Sunways Bio Science LLP's bill (Inv L0197/26-27, GRN 2667):
-- user confirmed ₹5,02,460 was the real amount transferred (matches what
-- Cash Book/Bank Ledger already correctly show) and the discount is a flat
-- 3% of the ₹5,18,000 invoice = ₹15,540 — 502460 + 15540 = 518000 exactly.
-- The bill's own Paid Amount field was wrong (₹4,86,920 instead of
-- ₹5,02,460), leaving a phantom ₹15,540 balance showing as still due on an
-- already fully-settled bill. No Cash Book/Bank Ledger change needed here —
-- those were already correct; only the pending_payments row was wrong.
UPDATE public.pending_payments
SET paid_amount = 502460.00
WHERE vendor_name ILIKE '%Sunways%' AND invoice_no = 'L0197/26-27' AND grn_no = '2667';

-- Verify: balance should now be 0
SELECT id, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount,
  (COALESCE(net_payable, invoice_amount, 0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) AS balance,
  payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%Sunways%' AND invoice_no = 'L0197/26-27' AND grn_no = '2667';

SELECT 'sentinel' AS marker, 1 AS n;
