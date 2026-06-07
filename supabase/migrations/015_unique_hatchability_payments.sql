-- Migration 015: Add UNIQUE constraints to hatchability and pending_payments
-- to prevent duplicate rows on repeated deploys (ON CONFLICT DO NOTHING was a no-op)

-- ── 1. DEDUP hatchability (keep first row per setting_no) ─────────
DELETE FROM public.hatchability a
USING public.hatchability b
WHERE a.ctid > b.ctid
  AND a.flock_id  = b.flock_id
  AND COALESCE(a.setting_no, 'NULL') = COALESCE(b.setting_no, 'NULL');

ALTER TABLE public.hatchability
  ADD CONSTRAINT hatchability_unique
  UNIQUE (flock_id, setting_no);

-- ── 2. DEDUP pending_payments (keep first row per grn_no) ─────────
DELETE FROM public.pending_payments a
USING public.pending_payments b
WHERE a.ctid > b.ctid
  AND a.vendor_name   = b.vendor_name
  AND COALESCE(a.grn_no, 'NULL') = COALESCE(b.grn_no, 'NULL');

ALTER TABLE public.pending_payments
  ADD CONSTRAINT pending_payments_unique
  UNIQUE (vendor_name, grn_no);

-- ── 3. DEDUP purchase_orders extra safety ─────────────────────────
-- The UNIQUE(po_no, item_name) already exists from migration 011; no action needed.

-- ── 4. Add production_date column to hatchability if missing ──────
ALTER TABLE public.hatchability
  ADD COLUMN IF NOT EXISTS production_date DATE;
