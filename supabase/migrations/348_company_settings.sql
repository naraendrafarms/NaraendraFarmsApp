-- Migration 348: Single-row company profile settings, editable from Admin Centre.
-- Used by the Purchase Order print (and future document prints) instead of
-- hardcoded company/terms text in POPages.tsx.

CREATE TABLE IF NOT EXISTS public.company_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      TEXT NOT NULL DEFAULT 'Naraendra Farms',
  address_line1     TEXT,
  address_line2     TEXT,
  gstin             TEXT,
  office_phone      TEXT,
  billing_location  TEXT,
  site_location     TEXT,
  po_terms          TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_settings' AND policyname = 'company_settings_all') THEN
    CREATE POLICY company_settings_all ON public.company_settings
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO public.company_settings (company_name, address_line1, address_line2, po_terms)
SELECT
  'Naraendra Farms',
  '5-9-22/21, JVR Amrit Enclave, Roshanlal Residency,',
  'Adarsh Nagar, Hyderabad - 500063',
  E'1. Please mention the PO number on all invoices, delivery challans and correspondence.\n2. Material must match the specifications above; rejected material will be returned at vendor''s cost.\n3. Invoice to be raised in the name of Naraendra Farms.'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- Verify
SELECT COUNT(*) AS company_settings_rows FROM public.company_settings;
