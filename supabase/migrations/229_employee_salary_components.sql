-- Optional per-employee salary component overrides.
-- When set, the salary calc uses these monthly amounts as the rate for each
-- component instead of auto-splitting base_salary 50/30/20.
-- When NULL/blank, the 50/30/20 fallback applies (no behaviour change).
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS basic_rate     NUMERIC;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS hra_rate       NUMERIC;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS allowance_rate NUMERIC;

-- Diagnostic: confirm columns exist
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='employees'
  AND column_name IN ('basic_rate','hra_rate','allowance_rate');
