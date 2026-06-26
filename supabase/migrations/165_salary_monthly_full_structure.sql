-- Migration 165: Add full payroll structure columns to salary_monthly
-- Matches the Excel payroll sheet structure exactly.
-- All new columns default to 0 so existing rows are unaffected.

-- Attendance
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS month_days       INTEGER NOT NULL DEFAULT 30;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS absent_days      NUMERIC(5,1) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS total_paid_days  NUMERIC(5,1);
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS extra_days       NUMERIC(4,1) NOT NULL DEFAULT 0;

-- Rate breakdown (stored so edits don't lose values)
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS gross_rate       NUMERIC(12,2);
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS basic_rate       NUMERIC(12,2);
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS hra_rate         NUMERIC(12,2);
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS other_defray     NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Earnings
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS extra_pay        NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS total_earning    NUMERIC(12,2);

-- Voluntary PF and LWF
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS vpf              NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS lwf              NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Other deductions and reimbursements
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS other_deduction  NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS other_reimbursement NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Advance tracking (advance column = advance_adjusted; add opening, further, closing)
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS advance_opening  NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS further_advance  NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS advance_closing  NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Employer PF breakdown
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS employer_eps     NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS employer_epf_diff NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS admin_charges    NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS edli_charge      NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Additional and CTC
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS additional       NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS monthly_ctc      NUMERIC(12,2);

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='salary_monthly'
ORDER BY ordinal_position;
