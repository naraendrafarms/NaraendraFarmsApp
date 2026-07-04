-- Migration 353: two additional site delivery contacts on company_settings,
-- shown on the PO printout next to Site/Delivery Location.
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS site_contact_1 TEXT,
  ADD COLUMN IF NOT EXISTS site_contact_2 TEXT;

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='company_settings'
  AND column_name IN ('site_contact_1','site_contact_2');
