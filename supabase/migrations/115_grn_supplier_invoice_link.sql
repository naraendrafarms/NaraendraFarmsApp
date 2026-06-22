-- Migration 115: Link supplier_invoices to grn (replaces medicine_purchase_id for new records)
-- Existing rows with medicine_purchase_id remain valid; new medicine GRN rows use grn_id.

ALTER TABLE public.supplier_invoices
  ADD COLUMN IF NOT EXISTS grn_id UUID REFERENCES public.grn(id) ON DELETE SET NULL;

ALTER TABLE public.supplier_invoices
  DROP CONSTRAINT IF EXISTS uq_supplier_invoices_grn;

ALTER TABLE public.supplier_invoices
  ADD CONSTRAINT uq_supplier_invoices_grn UNIQUE (grn_id);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_grn_id
  ON public.supplier_invoices(grn_id);

-- Diagnostic: confirm columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'supplier_invoices'
  AND column_name IN ('grn_id', 'medicine_purchase_id')
ORDER BY column_name;

NOTIFY pgrst, 'reload schema';
