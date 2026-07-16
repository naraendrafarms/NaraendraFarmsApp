-- Verify migration 466 landed correctly. run_sql.py only prints result rows
-- for the first 5 statements in a file, and 466 had 29 statements, so its
-- diagnostic SELECTs at the end never printed in the job log. Re-run just
-- the diagnostics here (fewer than 5 statements) so the actual counts show.
SELECT count(*) AS ebp_table_exists FROM information_schema.tables WHERE table_name='electricity_bill_payments';
SELECT count(*) AS cb_cols FROM information_schema.columns WHERE table_name='cash_book' AND column_name IN ('electricity_payment_id','batch_ref');
SELECT count(*) AS bt_cols FROM information_schema.columns WHERE table_name='bank_transactions' AND column_name IN ('electricity_payment_id','batch_ref');
SELECT count(*) AS backfilled_payments FROM public.electricity_bill_payments WHERE remarks='Migrated from single-payment record';
SELECT count(*) AS bills_with_paid_date FROM public.electricity_bills WHERE paid_date IS NOT NULL;
