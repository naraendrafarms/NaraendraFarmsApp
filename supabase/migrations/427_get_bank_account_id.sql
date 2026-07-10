-- fn_audit_log() is fine (properly wrapped) and a plain literal INSERT into
-- bank_transactions works (confirmed by migration 426). The 3 failed restore
-- attempts all used correlated scalar subqueries in the INSERT's SELECT list
-- combined with WHERE NOT EXISTS — get the concrete bank_account_id value so
-- the next attempt can use fully literal values instead.
SELECT bank_account_id, count(*) AS cnt
FROM salary_monthly
WHERE payment_ref = 'FCM-260710NZF59W' AND is_paid = true
GROUP BY bank_account_id;
