-- Fixes Sachin International Proteins Pvt Ltd's bill (Inv SIPPL/26-27/739,
-- GRN 2735). Root cause (see PendingPaymentsPage.tsx TDS % picker):
-- selecting a % from the TDS dropdown always overwrote TDS Amount with the
-- %-calculated figure, even over a manually-typed custom amount — fixed in
-- code this session (now only auto-fills when TDS Amount is blank).
-- Here: the user's real TDS was a flat ₹494 (not 0.1% of the invoice,
-- which the UI bug substituted as ₹2,296), and Paid Amount (₹22,95,725)
-- was already correctly entered against that real ₹494 TDS — it's
-- invoice_amount minus 494 exactly. Correcting tds_amount/tds_pct/
-- net_payable to match so the bill's own balance reconciles to zero.
UPDATE public.pending_payments
SET tds_amount = 494.00,
    tds_pct = ROUND((494.00 / invoice_amount) * 100, 4),
    net_payable = invoice_amount - 494.00
WHERE vendor_name ILIKE '%Sachin%' AND invoice_no = 'SIPPL/26-27/739' AND grn_no = '2735';

-- Verify: net_payable should now equal paid_amount (22,95,725), balance 0
SELECT id, invoice_no, grn_no, invoice_amount, tds_pct, tds_amount, net_payable, paid_amount,
  (COALESCE(net_payable, invoice_amount, 0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) AS balance,
  payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%Sachin%' AND invoice_no = 'SIPPL/26-27/739' AND grn_no = '2735';

SELECT 'sentinel' AS marker, 1 AS n;
