-- The CTE-based (WITH ... INSERT ... RETURNING ... UPDATE) pattern has now
-- silently failed to insert TWICE (migrations 420 and 423) while reporting
-- Errors: 0 — something about that construct isn't taking effect on this
-- runner/DB. Abandoning CTEs entirely: plain separate INSERT, then separate
-- UPDATE using a plain subquery (no RETURNING relied upon), verifying after
-- each step so a real failure is unambiguous.

INSERT INTO bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
SELECT (SELECT max(bank_account_id) FROM salary_monthly WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true),
       '2026-07-10', 'Debit', 'Salary Payment', 'FCM-260710NZF59W',
       'Salary batch — 198 employee(s) (restored after failed consolidation)',
       (SELECT sum(net_salary) FROM salary_monthly WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true)
WHERE NOT EXISTS (SELECT 1 FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W');

SELECT count(*) AS rows_after_insert, sum(amount) AS total_after_insert
FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W';

UPDATE salary_monthly
SET bank_txn_id = (SELECT id FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W' LIMIT 1)
WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true;

SELECT count(*) AS salary_rows_linked_after_update FROM salary_monthly
WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true AND bank_txn_id IS NOT NULL;
