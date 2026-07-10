SELECT 'sentinel' AS marker, 1 AS n;

SELECT bank_account_id, reference_no, txn_date, count(*) AS rows_in_batch, sum(amount) AS total_amount
FROM bank_transactions
WHERE salary_monthly_id IS NOT NULL
GROUP BY bank_account_id, reference_no, txn_date
ORDER BY txn_date DESC;
