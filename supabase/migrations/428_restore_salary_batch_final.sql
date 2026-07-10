-- Final restore of the salary batch bank_transactions row, using fully
-- literal values (no correlated subqueries) after 3 prior attempts using
-- subqueries in the INSERT's SELECT list silently failed. Values confirmed
-- via migration 427: bank_account_id=cfed81c5-6f97-4e4d-8888-1d8908b8967b,
-- 198 rows, total 2056780.00 (from migration 423's own diagnostic).
INSERT INTO bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
VALUES ('cfed81c5-6f97-4e4d-8888-1d8908b8967b', '2026-07-10', 'Debit', 'Salary Payment', 'FCM-260710NZF59W', 'Salary batch — 198 employee(s) (restored)', 2056780.00);

SELECT count(*) AS rows_now, sum(amount) AS total
FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W';

UPDATE salary_monthly
SET bank_txn_id = (SELECT id FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W' LIMIT 1)
WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true;

SELECT count(*) AS salary_rows_linked FROM salary_monthly
WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true AND bank_txn_id IS NOT NULL;
