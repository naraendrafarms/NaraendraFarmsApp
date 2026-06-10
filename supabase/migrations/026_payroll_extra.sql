-- Migration 026: Payroll extra columns
-- Add payment fields to salary_monthly
ALTER TABLE salary_monthly
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash',
  ADD COLUMN IF NOT EXISTS payment_ref TEXT,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- Add statutory applicability flags to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pt_applicable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS esi_applicable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pf_applicable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS uan_no TEXT,
  ADD COLUMN IF NOT EXISTS leaving_date DATE;
