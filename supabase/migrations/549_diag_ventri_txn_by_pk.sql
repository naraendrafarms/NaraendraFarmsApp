-- Diagnostic only (no schema changes) — 548's extra description filter
-- matched 0 rows (likely too strict), so querying directly by this bank
-- transaction's own primary key (c484c2e3-225e-4d9a-b7ad-135586c4c989,
-- captured unambiguously/un-truncated from migration 545's log output) to
-- settle definitively whether its linked_payment_id resolves to a real,
-- currently-existing pending_payments row.
SELECT bt.id AS txn_id, bt.amount AS txn_amount, bt.description, bt.linked_payment_id,
  pp.id AS bill_id, pp.vendor_name, pp.invoice_no, pp.grn_no,
  pp.invoice_amount, pp.net_payable, pp.discount_amount, pp.paid_amount, pp.payment_status
FROM public.bank_transactions bt
LEFT JOIN public.pending_payments pp ON pp.id = bt.linked_payment_id
WHERE bt.id = 'c484c2e3-225e-4d9a-b7ad-135586c4c989';

SELECT 'sentinel' AS marker, 1 AS n;
