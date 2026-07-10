-- Three separate INSERTs into bank_transactions (migrations 420, 423, 424)
-- have all reported Errors: 0 but inserted nothing. Check for a trigger,
-- rule, or RLS policy that could be silently swallowing/skipping the insert.
SELECT tgname, tgenabled, tgtype,
       pg_get_triggerdef(oid) AS def
FROM pg_trigger
WHERE tgrelid = 'public.bank_transactions'::regclass AND NOT tgisinternal;

SELECT relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.bank_transactions'::regclass;

SELECT polname, polcmd, polroles, pg_get_expr(polqual, polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy WHERE polrelid = 'public.bank_transactions'::regclass;

SELECT conname, contype, pg_get_constraintdef(oid) AS def
FROM pg_constraint WHERE conrelid = 'public.bank_transactions'::regclass;

-- Try one minimal raw insert with no dynamic values, see if it does anything
INSERT INTO bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
SELECT id, '2026-07-10', 'Debit', 'Salary Payment', 'TEST-DIAG-425', 'diagnostic test row', 1.00
FROM bank_accounts LIMIT 1;

SELECT count(*) AS test_row_exists FROM bank_transactions WHERE reference_no = 'TEST-DIAG-425';
