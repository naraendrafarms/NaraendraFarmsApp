-- Second half of the migration-466 diagnostics (ledger linkage + batch_ref
-- column), split into its own file so it also falls under run_sql.py's
-- first-5-statements print limit.
SELECT count(*) AS ebp_batch_ref_col FROM information_schema.columns WHERE table_name='electricity_bill_payments' AND column_name='batch_ref';
SELECT count(*) AS cb_linked FROM public.cash_book WHERE electricity_payment_id IS NOT NULL;
SELECT count(*) AS bt_linked FROM public.bank_transactions WHERE electricity_payment_id IS NOT NULL;
SELECT count(*) AS cb_with_bill_id_unlinked FROM public.cash_book WHERE electricity_bill_id IS NOT NULL AND electricity_payment_id IS NULL;
SELECT count(*) AS bt_with_bill_id_unlinked FROM public.bank_transactions WHERE electricity_bill_id IS NOT NULL AND electricity_payment_id IS NULL;
