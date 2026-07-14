-- TDS Payable report's "Paid"/"Pending" badge was actually the vendor-bill
-- payment_status / employee salary is_paid — it says nothing about whether
-- the TDS amount deducted was actually remitted to the government (due by
-- the 7th of the month following deduction). Add a distinct tracker so the
-- two are never conflated: the vendor/employee can be fully paid while the
-- TDS deposit to the department is still outstanding.
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_deposited BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_deposit_date DATE;
ALTER TABLE public.salary_monthly   ADD COLUMN IF NOT EXISTS tds_deposited BOOLEAN DEFAULT FALSE;
ALTER TABLE public.salary_monthly   ADD COLUMN IF NOT EXISTS tds_deposit_date DATE;

SELECT count(*) AS pp_cols FROM information_schema.columns
  WHERE table_name='pending_payments' AND column_name IN ('tds_deposited','tds_deposit_date');
SELECT count(*) AS sm_cols FROM information_schema.columns
  WHERE table_name='salary_monthly' AND column_name IN ('tds_deposited','tds_deposit_date');
