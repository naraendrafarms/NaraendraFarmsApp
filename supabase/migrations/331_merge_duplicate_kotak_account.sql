-- Merge the duplicate blank "Kotak Mahindra Bank" account into the real
-- "Kotak Mahindra Bank Ltd — 0045360473" account, then delete the duplicate.
-- Confirmed via migration 330: only 1 pending_payments row (Om Prakash Singh)
-- and 1 bank_transactions row reference the duplicate — move both, then it's
-- safe to delete.
UPDATE public.pending_payments
SET bank_account_id = 'cfed81c5-6f97-4e4d-8888-1d8908b8967b'
WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5';

UPDATE public.bank_transactions
SET bank_account_id = 'cfed81c5-6f97-4e4d-8888-1d8908b8967b'
WHERE bank_account_id = 'bb9627c4-24d3-461b-821a-50ce440600f5';

DELETE FROM public.bank_accounts
WHERE id = 'bb9627c4-24d3-461b-821a-50ce440600f5';

-- Verify Om Prakash Singh's bill and its ledger entry are now under the
-- correct account
SELECT pp.id, pp.vendor_name, pp.bank_account_id AS pp_bank_account_id,
       bt.id AS bank_txn_id, bt.bank_account_id AS bt_bank_account_id, bt.amount
FROM public.pending_payments pp
LEFT JOIN public.bank_transactions bt ON bt.linked_payment_id = pp.id
WHERE pp.id = '48a632ab-5a0c-44da-a7d7-030c26c15f8e';

-- Confirm the duplicate account is gone
SELECT COUNT(*) AS duplicate_account_remaining
FROM public.bank_accounts WHERE id = 'bb9627c4-24d3-461b-821a-50ce440600f5';
