-- Migration 176: Partner Remuneration
-- Partners are paid monthly (varying amount), TDS deducted at a set rate,
-- and the payable flows into pending_payments so it shows in TDS Payable + CMS Upload.

-- ── Partners master ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            TEXT NOT NULL,
  pan             TEXT,
  bank_name       TEXT,
  branch          TEXT,
  ifsc            TEXT,
  account_no      TEXT,
  default_tds_pct NUMERIC(5,2) DEFAULT 10,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partners_select ON public.partners;
CREATE POLICY partners_select ON public.partners FOR SELECT USING (true);
DROP POLICY IF EXISTS partners_insert ON public.partners;
CREATE POLICY partners_insert ON public.partners FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS partners_update ON public.partners;
CREATE POLICY partners_update ON public.partners FOR UPDATE USING (true);
DROP POLICY IF EXISTS partners_delete ON public.partners;
CREATE POLICY partners_delete ON public.partners FOR DELETE USING (true);

-- ── Mark partner-remuneration rows in pending_payments ───────────────────────
-- (so the entry page can list/edit them, and they're distinguishable from vendor bills)
ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS is_partner_remuneration BOOLEAN DEFAULT FALSE;

ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pp_partner_remun
  ON public.pending_payments(is_partner_remuneration, grn_date)
  WHERE is_partner_remuneration = TRUE;

-- Verify
SELECT 'partners' AS tbl, COUNT(*) AS rows FROM public.partners;
