-- Store the invoice Tax Amount explicitly so GRN matches the supplier bill:
--   basic_amount (Taxable) + gst_amount (Tax) = total_amount (Total)
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(14,2);

-- Backfill from existing rows where we can derive it (total - basic, else basic*gst%)
UPDATE public.grn
SET gst_amount = ROUND(COALESCE(total_amount - basic_amount,
                                basic_amount * COALESCE(gst_pct,0) / 100.0), 2)
WHERE gst_amount IS NULL
  AND basic_amount IS NOT NULL;

-- Diagnostic: confirm the column exists
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='grn' AND column_name='gst_amount';
