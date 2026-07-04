-- Migration 351: migration 348's CREATE TABLE IF NOT EXISTS was a no-op —
-- company_settings already existed (used by the Payslip Generator's Company
-- Settings editor in EmployeePages.tsx) with 22 duplicate rows and WITHOUT
-- the gstin/office_phone/billing_location/site_location/po_terms columns
-- the new Admin Centre > Company Profile tab and PO print expect.
--
-- Fix: (1) actually add the missing columns, (2) collapse the 22 rows down
-- to the one real row (most recently updated, non-null address) so every
-- `.limit(1).maybeSingle()` read across the app is deterministic.

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS gstin             TEXT,
  ADD COLUMN IF NOT EXISTS office_phone      TEXT,
  ADD COLUMN IF NOT EXISTS billing_location  TEXT,
  ADD COLUMN IF NOT EXISTS site_location     TEXT,
  ADD COLUMN IF NOT EXISTS po_terms          TEXT;

-- Diagnostic: show all rows before collapsing
SELECT id, company_name, address_line1, updated_at FROM public.company_settings ORDER BY updated_at DESC;

DO $$
DECLARE
  keeper_id UUID;
BEGIN
  SELECT id INTO keeper_id FROM public.company_settings
  WHERE address_line1 IS NOT NULL AND TRIM(address_line1) <> ''
  ORDER BY updated_at DESC LIMIT 1;

  IF keeper_id IS NULL THEN
    SELECT id INTO keeper_id FROM public.company_settings ORDER BY updated_at DESC LIMIT 1;
  END IF;

  IF keeper_id IS NOT NULL THEN
    UPDATE public.company_settings SET po_terms = COALESCE(po_terms,
      E'1. Please mention the PO number on all invoices, delivery challans and correspondence.\n2. Material must match the specifications above; rejected material will be returned at vendor''s cost.\n3. Invoice to be raised in the name of Naraendra Farms.')
    WHERE id = keeper_id;

    DELETE FROM public.company_settings WHERE id <> keeper_id;
  END IF;
END $$;

-- Verify: exactly one row should remain
SELECT COUNT(*) AS company_settings_rows_after FROM public.company_settings;
