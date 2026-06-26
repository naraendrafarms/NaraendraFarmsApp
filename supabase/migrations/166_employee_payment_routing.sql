-- Migration 166: Employee payment routing fields
-- payment_mode: how salary is disbursed (own_account / shared_account / cash)
-- shared_with_emp_id: if shared_account, which employee's bank account to credit

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS payment_mode      TEXT NOT NULL DEFAULT 'own_account';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS shared_with_emp_id UUID REFERENCES public.employees(id);

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='employees'
  AND column_name IN ('payment_mode','shared_with_emp_id')
ORDER BY column_name;
