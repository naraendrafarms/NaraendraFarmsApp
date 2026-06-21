-- Migration 099: GST master-data fields
-- Company GSTIN + state fix, party GST classification, item HSN + GST rate

-- ── COMPANY SETTINGS ───────────────────────────────────────────
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS state_code TEXT;

-- Set our own GSTIN + Telangana (state code 36).
-- Update the single existing settings row if present.
UPDATE public.company_settings
   SET gstin = '36ABJFM1393C1ZC',
       state = 'Telangana',
       state_code = '36'
 WHERE id = (SELECT id FROM public.company_settings ORDER BY created_at LIMIT 1);

-- If no row exists yet, create one.
INSERT INTO public.company_settings (company_name, state, state_code, gstin)
SELECT 'Naraendra Farms', 'Telangana', '36', '36ABJFM1393C1ZC'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings LIMIT 1);

-- ── PARTIES (GST classification) ───────────────────────────────
-- gst_type: registered / unregistered / composition
-- state_code: derived from GSTIN first 2 digits (frontend auto-fills)
-- is_rcm_default: when TRUE, purchases from this party default to RCM (e.g. rent/landlord)
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'unregistered';
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS is_rcm_default BOOLEAN DEFAULT FALSE;

-- Backfill: any party that already has a GSTIN is registered, state from first 2 chars
UPDATE public.parties
   SET gst_type = 'registered',
       state_code = substring(gstin from 1 for 2)
 WHERE gstin IS NOT NULL AND length(gstin) = 15;

-- ── ITEM MASTERS (HSN + GST rate) ──────────────────────────────
ALTER TABLE public.feed_ingredients ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE public.feed_ingredients ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.general_items     ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 0;

-- Diagnostic
SELECT 'company_settings' AS tbl, count(*) FILTER (WHERE gstin IS NOT NULL) AS gst_rows FROM public.company_settings
UNION ALL SELECT 'parties_registered', count(*) FROM public.parties WHERE gst_type = 'registered';
