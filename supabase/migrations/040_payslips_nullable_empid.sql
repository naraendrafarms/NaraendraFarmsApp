-- Migration 040: Make payslips.employee_id nullable + add manual employee detail columns
ALTER TABLE public.payslips ALTER COLUMN employee_id DROP NOT NULL;

ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS emp_name TEXT,
  ADD COLUMN IF NOT EXISTS emp_id_manual TEXT,
  ADD COLUMN IF NOT EXISTS emp_designation TEXT,
  ADD COLUMN IF NOT EXISTS emp_department TEXT,
  ADD COLUMN IF NOT EXISTS emp_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS emp_account_no TEXT,
  ADD COLUMN IF NOT EXISTS emp_uan_no TEXT;

NOTIFY pgrst, 'reload schema';
