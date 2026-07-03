-- Backfill cash_book + bank_transactions entries for Paid pending_payments
-- bills that already have bank_account_id set (the genuine ledger-sync bug
-- signature: user recorded which account paid it, but the sync only fired
-- on a Pending->Paid transition, so an already-Paid bill edited afterward
-- to add bank details never got its ledger entry). Scope confirmed via
-- migration 324: only 4 of the 127 Paid-but-unlisted bills have
-- bank_account_id IS NOT NULL — the other 123 never had a bank account
-- selected at all (predate the bank-account selector) and are left alone.
-- Mirrors exactly what postLedgerEntry() in PendingPaymentsPage.tsx inserts.
INSERT INTO public.cash_book (txn_date, txn_type, category, description, party_name, reference_no, amount_in, amount_out, payment_mode, pending_payment_id, remarks)
SELECT
  COALESCE(pay_before_date, CURRENT_DATE),
  'payment',
  'purchase_payment',
  'Payment to ' || vendor_name || COALESCE(' — Inv ' || invoice_no, '') || COALESCE(' / GRN ' || grn_no, ''),
  vendor_name,
  COALESCE(utr_no, cheque_no),
  0,
  net_payable,
  CASE WHEN lower(coalesce(account_type,'')) = 'cash' THEN 'cash' WHEN lower(coalesce(account_type,'')) = 'upi' THEN 'upi' ELSE 'cheque' END,
  id,
  remarks
FROM public.pending_payments
WHERE payment_status = 'Paid'
  AND bank_account_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.pending_payment_id = pending_payments.id);

INSERT INTO public.bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount, linked_payment_id)
SELECT
  bank_account_id,
  COALESCE(pay_before_date, CURRENT_DATE),
  'Debit',
  'Vendor Payment',
  COALESCE(utr_no, cheque_no),
  'Payment to ' || vendor_name || COALESCE(' — Inv ' || invoice_no, '') || COALESCE(' / GRN ' || grn_no, ''),
  net_payable,
  id
FROM public.pending_payments
WHERE payment_status = 'Paid'
  AND bank_account_id IS NOT NULL
  AND lower(coalesce(account_type,'')) <> 'cash'
  AND NOT EXISTS (SELECT 1 FROM public.bank_transactions bt WHERE bt.linked_payment_id = pending_payments.id);

-- Verify
SELECT COUNT(*) AS cash_book_rows_now_for_bank_tagged_bills
FROM public.cash_book cb
JOIN public.pending_payments pp ON pp.id = cb.pending_payment_id
WHERE pp.bank_account_id IS NOT NULL AND pp.payment_status = 'Paid';

SELECT COUNT(*) AS bank_txn_rows_now_for_bank_tagged_bills
FROM public.bank_transactions bt
JOIN public.pending_payments pp ON pp.id = bt.linked_payment_id
WHERE pp.bank_account_id IS NOT NULL AND pp.payment_status = 'Paid';

SELECT cb.id AS cash_book_id, bt.id AS bank_txn_id, cb.amount_out, bt.amount
FROM public.pending_payments pp
LEFT JOIN public.cash_book cb ON cb.pending_payment_id = pp.id
LEFT JOIN public.bank_transactions bt ON bt.linked_payment_id = pp.id
WHERE pp.id = '48a632ab-5a0c-44da-a7d7-030c26c15f8e';
