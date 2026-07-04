-- Migration 352: get exact FK constraint names from nhe_sales to bank_accounts
-- (need this to fix an ambiguous-embed bug in the NHE Sales list query caused
-- by migration 350 adding a second FK, refund_bank_account_id, to the same table)
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS ref_table,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.nhe_sales'::regclass AND confrelid = 'public.bank_accounts'::regclass;
