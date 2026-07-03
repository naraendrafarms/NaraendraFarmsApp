-- Migration 325's cash_book insert succeeded (4 rows), but its
-- bank_transactions insert failed atomically — one of the 4 bank-tagged
-- bills has a NULL net_payable, which violates bank_transactions.amount's
-- NOT NULL constraint and aborted the whole statement (Postgres statements
-- are all-or-nothing), leaving ALL 4 bills including Om Prakash Singh
-- without a bank_transactions row. Retry using COALESCE(net_payable,
-- invoice_amount) as the amount, and skip only truly-zero/null-both rows.
INSERT INTO public.bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount, linked_payment_id)
SELECT
  bank_account_id,
  COALESCE(pay_before_date, CURRENT_DATE),
  'Debit',
  'Vendor Payment',
  COALESCE(utr_no, cheque_no),
  'Payment to ' || vendor_name || COALESCE(' — Inv ' || invoice_no, '') || COALESCE(' / GRN ' || grn_no, ''),
  COALESCE(net_payable, invoice_amount, 0),
  id
FROM public.pending_payments
WHERE payment_status = 'Paid'
  AND bank_account_id IS NOT NULL
  AND lower(coalesce(account_type,'')) <> 'cash'
  AND COALESCE(net_payable, invoice_amount, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM public.bank_transactions bt WHERE bt.linked_payment_id = pending_payments.id);

-- Verify: which of the 4 had NULL net_payable (for the record)
SELECT id, vendor_name, invoice_no, net_payable, invoice_amount, bank_account_id, account_type
FROM public.pending_payments
WHERE payment_status = 'Paid' AND bank_account_id IS NOT NULL AND net_payable IS NULL;

-- Verify all 4 bank-tagged bills now have both entries
SELECT pp.id, pp.vendor_name, cb.id AS cash_book_id, bt.id AS bank_txn_id, cb.amount_out, bt.amount
FROM public.pending_payments pp
LEFT JOIN public.cash_book cb ON cb.pending_payment_id = pp.id
LEFT JOIN public.bank_transactions bt ON bt.linked_payment_id = pp.id
WHERE pp.payment_status = 'Paid' AND pp.bank_account_id IS NOT NULL;
