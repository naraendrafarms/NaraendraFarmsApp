-- Prior diagnostic (425) found bank_transactions has an AFTER INSERT/UPDATE/
-- DELETE trigger trg_audit -> fn_audit_log(). Per CLAUDE.md's own warning,
-- if that function isn't wrapped in an EXCEPTION handler (or references a
-- wrong column for bank_transactions), a trigger failure rolls back the
-- whole INSERT — and if the error text matches run_sql.py's silent-success
-- substrings ("does not exist" etc.), it reports Errors: 0 while nothing
-- was actually inserted. Put the test result FIRST so it isn't truncated
-- by the runner's print limit (only first ~4 statements ever show output).
INSERT INTO bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
SELECT id, '2026-07-10', 'Debit', 'Salary Payment', 'TEST-DIAG-426', 'diagnostic test row', 1.00
FROM bank_accounts LIMIT 1;

SELECT count(*) AS test_row_exists FROM bank_transactions WHERE reference_no = 'TEST-DIAG-426';

SELECT prosrc FROM pg_proc WHERE proname = 'fn_audit_log';

DELETE FROM bank_transactions WHERE reference_no = 'TEST-DIAG-426';
