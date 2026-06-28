-- Migration 219: add per-line transport/other charges to GRN for landed cost.
-- Landed rate/unit = price_per_unit + (other_charges / qty). Used by production/feed cost.
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS other_charges NUMERIC(12,2) DEFAULT 0;

SELECT 'ok' AS chk,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='grn' AND column_name='other_charges') AS has_col;
