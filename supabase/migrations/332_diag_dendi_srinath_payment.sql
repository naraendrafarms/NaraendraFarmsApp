-- Investigate "Dendi Srinath Reddy Rent" (invoice 003, ₹42,000, Paid) not
-- showing in Kotak Bank Ledger, and check why the bank name shown looks
-- different from expected.
SELECT id, vendor_name, invoice_no, category, net_payable, invoice_amount,
       account_type, bank_account_id, payment_status, pay_before_date, utr_no, cheque_no
FROM public.pending_payments
WHERE vendor_name ILIKE '%Dendi Srinath%' OR invoice_no = '003'
ORDER BY created_at DESC;

SELECT id, account_name, bank_name, account_no, is_active FROM public.bank_accounts ORDER BY bank_name;

SELECT bt.id, bt.bank_account_id, bt.txn_date, bt.amount, bt.linked_payment_id, bt.description
FROM public.bank_transactions bt
JOIN public.pending_payments pp ON pp.id = bt.linked_payment_id
WHERE pp.vendor_name ILIKE '%Dendi Srinath%';

SELECT id, txn_date, amount, pending_payment_id, description, payment_mode
FROM public.cash_book
WHERE description ILIKE '%Dendi Srinath%' OR party_name ILIKE '%Dendi Srinath%';
