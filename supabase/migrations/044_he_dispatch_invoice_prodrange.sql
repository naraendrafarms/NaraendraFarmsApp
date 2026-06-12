-- Migration 044: Add invoice_no and prod_date_to to he_dispatch
-- invoice_no: actual invoice document number (e.g. INV-2026-001)
-- prod_date_to: allows a date range for production (prod_date → prod_date_to)
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS invoice_no   TEXT,
  ADD COLUMN IF NOT EXISTS prod_date_to DATE;

NOTIFY pgrst, 'reload schema';
