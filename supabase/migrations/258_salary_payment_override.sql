-- Per-month payment account override, so "pay into someone else's account"
-- can be set for a single payroll month without editing the employee's
-- permanent Bank Details / Salary Payment Mode every cycle.
ALTER TABLE public.salary_monthly
  ADD COLUMN IF NOT EXISTS override_account_emp_id UUID REFERENCES public.employees(id);

SELECT 'ok' AS chk;
