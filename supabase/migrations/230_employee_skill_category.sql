-- Skill category drives the minimum-wage floor for the Basic component.
-- UnSkilled=14840, Semi-Skilled=10850, Skilled=11950, Highly Skilled=14000.
-- Used by the salary auto-split (mirrors the payroll Excel formula).
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS skill_category TEXT;

-- Diagnostic: confirm column exists
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='employees'
  AND column_name = 'skill_category';
