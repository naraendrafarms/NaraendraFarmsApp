-- Migration 224: free chicks (free birds received, not charged) on GRN.
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS free_qty NUMERIC(12,2) DEFAULT 0;

SELECT 'ok' AS chk,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='grn' AND column_name='free_qty') AS has_col;
