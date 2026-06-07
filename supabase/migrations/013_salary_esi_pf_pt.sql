-- Migration 013: Add ESI, PF, PT deduction columns to salary_monthly
-- These apply from April 2026 onwards for eligible employees

ALTER TABLE public.salary_monthly
  ADD COLUMN IF NOT EXISTS esi_employee   NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS esi_employer   NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pf_employee    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pf_employer    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pt             NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_salary   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS basic_salary   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS hra            NUMERIC(10,2) DEFAULT 0;
