-- Full usage detail for the duplicate "Kotak Mahindra Bank — null" account
-- (id bb9627c4-24d3-461b-821a-50ce440600f5), which was truncated in the
-- previous diagnostic's output. This is the account currently stored on
-- Om Prakash Singh's bill and used by the earlier backfill (migrations
-- 325/326) — if it has transactions, they need to be MOVED to the correct
-- "Kotak Mahindra Bank Ltd — 0045360473" account (cfed81c5-6f97-4e4d-8888-1d8908b8967b),
-- not just left behind when this duplicate is deleted.
SELECT
  (SELECT COUNT(*) FROM public.bank_transactions WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5') AS txn_count,
  (SELECT COUNT(*) FROM public.pending_payments WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5') AS pp_count,
  (SELECT COUNT(*) FROM public.salary_monthly WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5') AS salary_count;

SELECT id, vendor_name, invoice_no, net_payable, bank_account_id, payment_status
FROM public.pending_payments
WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5';

SELECT id, txn_date, txn_type, category, amount, linked_payment_id, description
FROM public.bank_transactions
WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5'
ORDER BY txn_date;
