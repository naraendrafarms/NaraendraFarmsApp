-- Migration 164: Add payroll-related fields to employees table
-- restrict_pf: cap PF calculation at Rs 15,000 basic
-- zone_area, category (Unskilled/Skilled etc), location_branch from payroll Excel

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS restrict_pf      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS zone_area        TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emp_category     TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS location_branch  TEXT;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='employees'
  AND column_name IN ('restrict_pf','zone_area','emp_category','location_branch')
ORDER BY column_name;
