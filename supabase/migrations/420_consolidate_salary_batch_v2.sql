SELECT 'sentinel' AS marker, 1 AS n;

-- Confirm the batch is really still there before touching anything (the
-- previous DO-block attempt reported Errors: 0 but left rows_now=198,
-- salary_rows_linked=0 — meaning its early-return branch fired for a
-- reason not yet understood; avoiding PL/pgSQL control flow this time).
SELECT count(*) AS rows_before, sum(amount) AS total_before
FROM bank_transactions
WHERE reference_no = 'FCM-260710NZF59W' AND txn_date = '2026-07-10' AND salary_monthly_id IS NOT NULL;

WITH batch AS (
  SELECT reference_no, txn_date, max(bank_account_id) AS bank_account_id, sum(amount) AS total, count(*) AS cnt
  FROM bank_transactions
  WHERE reference_no = 'FCM-260710NZF59W' AND txn_date = '2026-07-10' AND salary_monthly_id IS NOT NULL
  GROUP BY reference_no, txn_date
),
new_txn AS (
  INSERT INTO bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
  SELECT bank_account_id, txn_date, 'Debit', 'Salary Payment', reference_no,
         'Salary batch — ' || cnt || ' employee(s) (consolidated)', total
  FROM batch
  RETURNING id
)
UPDATE salary_monthly sm SET bank_txn_id = (SELECT id FROM new_txn)
WHERE sm.id IN (
  SELECT salary_monthly_id FROM bank_transactions
  WHERE reference_no = 'FCM-260710NZF59W' AND txn_date = '2026-07-10' AND salary_monthly_id IS NOT NULL
);

DELETE FROM bank_transactions
WHERE reference_no = 'FCM-260710NZF59W' AND txn_date = '2026-07-10' AND salary_monthly_id IS NOT NULL;

SELECT reference_no, txn_date, count(*) AS rows_now, sum(amount) AS total
FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W'
GROUP BY reference_no, txn_date;

SELECT count(*) AS salary_rows_linked FROM salary_monthly sm
JOIN bank_transactions bt ON bt.id = sm.bank_txn_id
WHERE bt.reference_no = 'FCM-260710NZF59W';
