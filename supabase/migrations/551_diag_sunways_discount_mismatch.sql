-- Diagnostic only (no schema changes) — user reports the same Bank
-- Ledger/Cash Book "showing full amount instead of actual paid" issue for
-- Sunways Bio Science LLP, Inv L0197/26-27 / GRN 2667 (Invoice 5,18,000,
-- Paid 4,86,920, Discount 15,540 per the Pending Payments row). This bill
-- was very likely edited/marked Paid BEFORE today's code fix (which only
-- prevents future re-edits from re-posting the wrong amount), so its
-- already-posted cash_book/bank_transactions rows may still carry the old
-- gross figure. Checking current state of the bill and its linked ledger
-- entries before touching anything.
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, net_payable, discount_amount, paid_amount,
  (COALESCE(net_payable, invoice_amount, 0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) AS balance,
  payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%Sunways%' AND invoice_no = 'L0197/26-27' AND grn_no = '2667';

SELECT 'cash_book' AS src, id, txn_date, description, amount_out, reference_no
FROM public.cash_book
WHERE pending_payment_id IN (
  SELECT id FROM public.pending_payments WHERE vendor_name ILIKE '%Sunways%' AND invoice_no = 'L0197/26-27' AND grn_no = '2667'
);

SELECT 'bank_txn' AS src, id, txn_date, description, amount, reference_no
FROM public.bank_transactions
WHERE linked_payment_id IN (
  SELECT id FROM public.pending_payments WHERE vendor_name ILIKE '%Sunways%' AND invoice_no = 'L0197/26-27' AND grn_no = '2667'
);

SELECT 'sentinel' AS marker, 1 AS n;
