-- Migration 354: sanity-check the columns/constraint referenced by the new
-- Bird Sales Report query (invoice_no, gst_pct, remarks, cash_farm_id,
-- refund_amount, refund_date, and the bank_accounts FK name) actually exist
-- on nhe_sales, since the report shows nothing (likely a silent query error
-- swallowed client-side, same class of bug as the earlier bank_accounts embed).
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='nhe_sales'
  AND column_name IN ('invoice_no','gst_pct','remarks','cash_farm_id','refund_amount','refund_date','is_employee_sale','bird_category','bird_sex')
ORDER BY column_name;

SELECT conname FROM pg_constraint
WHERE conrelid = 'public.nhe_sales'::regclass AND conname = 'nhe_sales_bank_account_id_fkey';

SELECT COUNT(*) AS bird_sale_rows FROM public.nhe_sales
WHERE sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error');
