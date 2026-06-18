-- Migration 071: Link medicine_purchases → supplier_invoices
-- Adds a FK column so each medicine purchase can reference its supplier invoice row.

ALTER TABLE public.supplier_invoices
  ADD COLUMN IF NOT EXISTS medicine_purchase_id UUID
    REFERENCES public.medicine_purchases(id) ON DELETE SET NULL;

-- Unique constraint needed for upsert on medicine_purchase_id
ALTER TABLE public.supplier_invoices
  DROP CONSTRAINT IF EXISTS uq_supplier_invoices_med_purchase;
ALTER TABLE public.supplier_invoices
  ADD CONSTRAINT uq_supplier_invoices_med_purchase UNIQUE (medicine_purchase_id);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_med_purchase
  ON public.supplier_invoices(medicine_purchase_id);

NOTIFY pgrst, 'reload schema';
