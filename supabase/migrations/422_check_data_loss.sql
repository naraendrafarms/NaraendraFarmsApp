-- Migration 421 showed salary_rows_linked=0 and old_rows_remaining=0, but the
-- rows_now/total query printed NOTHING (0 rows) instead of the expected 1 row
-- for reference_no='FCM-260710NZF59W'. This could mean the consolidated
-- replacement row was never created — i.e. all 198 old rows were deleted with
-- no replacement. Check directly, one query per statement so nothing is
-- suppressed, most critical checks first.
SELECT count(*) AS any_row_with_ref FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W';

SELECT count(*) AS total_bank_txn_rows FROM bank_transactions;

SELECT count(*) AS rows_with_null_ref_salary_link FROM bank_transactions
WHERE salary_monthly_id IS NULL AND description LIKE 'Salary batch%';

SELECT sum(amount) AS sum_for_date FROM bank_transactions WHERE txn_date = '2026-07-10';

SELECT id, bank_account_id, txn_date, txn_type, category, reference_no, description, amount
FROM bank_transactions
WHERE description LIKE '%consolidated%' OR reference_no = 'FCM-260710NZF59W'
ORDER BY created_at DESC LIMIT 5;
