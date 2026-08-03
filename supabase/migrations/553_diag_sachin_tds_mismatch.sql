-- Diagnostic only (no schema changes) — user reports adding TDS (0.1%)
-- after the fact for Sachin International Proteins Pvt Ltd (Inv
-- SIPPL/26-27/739, GRN 2735) caused Paid Amount to show a value they
-- didn't enter. Per the pasted row: Invoice 22,96,219, TDS 2,296 (0.1%),
-- Net Payable 22,93,923, Paid Amount 22,95,725 — none of these numbers
-- reconcile against each other (22,95,725 isn't the invoice, net payable,
-- or invoice-minus-half-TDS). Checking the exact stored row before
-- touching anything.
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, tds_pct, tds_amount, net_payable,
  discount_amount, paid_amount, payment_status,
  (COALESCE(net_payable, invoice_amount, 0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) AS balance
FROM public.pending_payments
WHERE vendor_name ILIKE '%Sachin%' AND invoice_no = 'SIPPL/26-27/739' AND grn_no = '2735';

SELECT 'sentinel' AS marker, 1 AS n;
