-- Migration 021: Add extra fields to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS dob         DATE,
  ADD COLUMN IF NOT EXISTS gender      TEXT,
  ADD COLUMN IF NOT EXISTS mobile      TEXT,
  ADD COLUMN IF NOT EXISTS esi_no      TEXT,
  ADD COLUMN IF NOT EXISTS pf_no       TEXT;
