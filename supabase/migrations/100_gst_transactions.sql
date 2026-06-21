-- Migration 100: GST fields on transactions (purchases + sales)
-- ITC is NOT claimed — tax is recorded only for GSTR-1/3B reporting & RCM liability.

-- ── PURCHASES (grn) ────────────────────────────────────────────
-- grn already has: gst_pct, gst_amount, total_amount, basic_amount
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS supply_type    TEXT;            -- 'intra' / 'inter'
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS nature         TEXT DEFAULT 'purchase'; -- purchase/expense/asset
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS is_rcm         BOOLEAN DEFAULT FALSE;
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS taxable        BOOLEAN DEFAULT TRUE;
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS cgst_amount    NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS sgst_amount    NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS igst_amount    NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS party_gstin    TEXT;
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS hsn_code       TEXT;

-- ── NHE SALES ──────────────────────────────────────────────────
-- nhe_sales has NO invoice_no yet
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS invoice_no    TEXT;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS supply_type   TEXT;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS gst_pct       NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS taxable_value NUMERIC(14,2);
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS cgst_amount   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS sgst_amount   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS igst_amount   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS buyer_gstin   TEXT;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS hsn_code      TEXT;

-- ── HE DISPATCH ────────────────────────────────────────────────
-- he_dispatch already has invoice_no
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS supply_type   TEXT;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS gst_pct       NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS taxable_value NUMERIC(14,2);
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS cgst_amount   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS sgst_amount   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS igst_amount   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS buyer_gstin   TEXT;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS hsn_code      TEXT;

-- Diagnostic: confirm key new columns exist
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND ((table_name='grn' AND column_name='supply_type')
    OR (table_name='nhe_sales' AND column_name='invoice_no')
    OR (table_name='he_dispatch' AND column_name='supply_type'))
ORDER BY table_name;
