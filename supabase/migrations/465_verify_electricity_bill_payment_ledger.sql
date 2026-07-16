SELECT count(*) AS eb_cols FROM information_schema.columns
  WHERE table_name='electricity_bills' AND column_name IN ('payment_mode','bank_account_id');
SELECT count(*) AS cb_col FROM information_schema.columns
  WHERE table_name='cash_book' AND column_name='electricity_bill_id';
SELECT count(*) AS bt_col FROM information_schema.columns
  WHERE table_name='bank_transactions' AND column_name='electricity_bill_id';
