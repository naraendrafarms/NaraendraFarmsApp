-- Migration 420 ran with Errors: 0 (confirmed rows_before=198, total_before=2056780.00)
-- but run_sql.py only prints the first 4 statements' output, so its final
-- verification queries (statements 5-6) never appeared in the log. Re-run
-- just those checks as the FIRST statements here so they print.
SELECT reference_no, txn_date, count(*) AS rows_now, sum(amount) AS total
FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W'
GROUP BY reference_no, txn_date;

SELECT count(*) AS salary_rows_linked FROM salary_monthly sm
JOIN bank_transactions bt ON bt.id = sm.bank_txn_id
WHERE bt.reference_no = 'FCM-260710NZF59W';

SELECT count(*) AS old_rows_remaining FROM bank_transactions
WHERE reference_no = 'FCM-260710NZF59W' AND salary_monthly_id IS NOT NULL;
