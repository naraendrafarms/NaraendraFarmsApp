-- Dendi Srinath Reddy Rent (invoice 003) already has paid_amount = net_payable
-- = ₹42,000 (paid via the Pay button on 2026-07-02, bank_account_id already
-- correctly set to Kotak Mahindra Bank Ltd) but payment_status never flipped
-- to 'Paid' — most likely overwritten back to 'Pending' by a later Edit save
-- using a stale cached copy of the row. Fix the status, then post the missing
-- ledger entries (mirrors postLedgerEntry() in PendingPaymentsPage.tsx).
UPDATE public.pending_payments
SET payment_status = 'Paid'
WHERE id = 'e784ea50-c90c-4693-b884-53d8616e4f8b';

INSERT INTO public.cash_book (txn_date, txn_type, category, description, party_name, reference_no, amount_in, amount_out, payment_mode, pending_payment_id, remarks)
SELECT paid_date, 'payment', 'purchase_payment',
       'Payment to ' || vendor_name || COALESCE(' — Inv ' || invoice_no, ''),
       vendor_name, utr_no, 0, paid_amount, 'cheque', id, remarks
FROM public.pending_payments
WHERE id = 'e784ea50-c90c-4693-b884-53d8616e4f8b'
  AND NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.pending_payment_id = pending_payments.id);

INSERT INTO public.bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount, linked_payment_id)
SELECT bank_account_id, paid_date, 'Debit', 'Vendor Payment', utr_no,
       'Payment to ' || vendor_name || COALESCE(' — Inv ' || invoice_no, ''),
       paid_amount, id
FROM public.pending_payments
WHERE id = 'e784ea50-c90c-4693-b884-53d8616e4f8b'
  AND NOT EXISTS (SELECT 1 FROM public.bank_transactions bt WHERE bt.linked_payment_id = pending_payments.id);

-- Verify
SELECT pp.id, pp.vendor_name, pp.payment_status, cb.id AS cash_book_id, bt.id AS bank_txn_id, cb.amount_out, bt.amount
FROM public.pending_payments pp
LEFT JOIN public.cash_book cb ON cb.pending_payment_id = pp.id
LEFT JOIN public.bank_transactions bt ON bt.linked_payment_id = pp.id
WHERE pp.id = 'e784ea50-c90c-4693-b884-53d8616e4f8b';
