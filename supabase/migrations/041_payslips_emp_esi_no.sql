-- Migration 041: Add emp_esi_no column to payslips
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS emp_esi_no TEXT;

NOTIFY pgrst, 'reload schema';
