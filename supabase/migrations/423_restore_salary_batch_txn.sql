-- Migration 420 deleted the 198 old bank_transactions rows for the
-- FCM-260710NZF59W salary batch but its INSERT/UPDATE silently failed to
-- create the replacement row (confirmed via migration 422: any_row_with_ref=0,
-- sum_for_date=null). Restore from salary_monthly, which still has
-- payment_ref/bank_account_id intact (only bank_txn_id was ever meant to
-- change, and that update never ran). Verify count/total BEFORE inserting.
SELECT count(*) AS matching_salary_rows, sum(net_salary) AS total_net_salary,
       count(DISTINCT bank_account_id) AS distinct_bank_accounts
FROM salary_monthly
WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true;

WITH batch AS (
  SELECT max(bank_account_id) AS bank_account_id, sum(net_salary) AS total, count(*) AS cnt
  FROM salary_monthly
  WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true
),
new_txn AS (
  INSERT INTO bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
  SELECT bank_account_id, '2026-07-10', 'Debit', 'Salary Payment', 'FCM-260710NZF59W',
         'Salary batch — ' || cnt || ' employee(s) (restored after failed consolidation)', total
  FROM batch
  RETURNING id
)
UPDATE salary_monthly sm SET bank_txn_id = (SELECT id FROM new_txn)
WHERE sm.payment_ref = 'FCM-260710NZF59W' AND sm.is_paid = true;

SELECT reference_no, txn_date, count(*) AS rows_now, sum(amount) AS total
FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W'
GROUP BY reference_no, txn_date;

SELECT count(*) AS salary_rows_linked FROM salary_monthly sm
JOIN bank_transactions bt ON bt.id = sm.bank_txn_id
WHERE bt.reference_no = 'FCM-260710NZF59W';
