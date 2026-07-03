-- Check whether any bank_transactions rows now exist linked to a
-- pending_payments/salary_monthly row (from the recent Pending Payments /
-- Purchase Entry / Salary bank-account fixes), to see if the insert side
-- is actually working, or if the gap is purely on the display/query side.
SELECT id, bank_account_id, txn_date, txn_type, category, amount, linked_payment_id, salary_monthly_id, created_at
FROM public.bank_transactions
WHERE linked_payment_id IS NOT NULL OR salary_monthly_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

SELECT COUNT(*) AS total_bank_txns, COUNT(bank_account_id) AS with_account
FROM public.bank_transactions;
