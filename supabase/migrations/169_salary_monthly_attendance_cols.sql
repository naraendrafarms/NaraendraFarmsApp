-- Add attendance summary columns to salary_monthly for monthly grid page
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS present_days  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS half_days     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS wo_days       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS ot_days       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.salary_monthly ADD COLUMN IF NOT EXISTS ot_hours      NUMERIC(6,1) NOT NULL DEFAULT 0;
