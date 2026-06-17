-- Migration 068: Central supplier invoice register
-- Tracks all inbound invoices (chick supply, feed/GRN, medicines, electricity, other)
-- Links to the originating record (flock, grn, etc.) and tracks payment status

CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no      TEXT NOT NULL,
  invoice_date    DATE NOT NULL,
  -- Supplier (use party from parties master, or free-text name)
  party_id        UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  supplier_name   TEXT,
  -- Source linking
  source_type     TEXT NOT NULL DEFAULT 'other'
    CHECK (source_type IN ('chick','grn','medicine','electricity','labour','other')),
  flock_id        UUID REFERENCES public.flocks(id) ON DELETE SET NULL,
  grn_id          UUID REFERENCES public.grn(id) ON DELETE SET NULL,
  farm_id         UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  -- Amounts
  basic_amount    NUMERIC(14,2),
  gst_pct         NUMERIC(5,2) DEFAULT 0,
  gst_amount      NUMERIC(14,2),
  total_amount    NUMERIC(14,2) NOT NULL,
  -- Payment tracking
  payment_status  TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid')),
  paid_amount     NUMERIC(14,2) DEFAULT 0,
  due_date        DATE,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_invoices"   ON public.supplier_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_invoices" ON public.supplier_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_invoices" ON public.supplier_invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_invoices" ON public.supplier_invoices FOR DELETE TO authenticated USING (true);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_flock  ON public.supplier_invoices(flock_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_grn    ON public.supplier_invoices(grn_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date   ON public.supplier_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices(payment_status);

-- Add chick_invoice_no to flocks for quick reference (links back to supplier_invoices)
ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS chick_invoice_no TEXT;
ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS chick_invoice_date DATE;

NOTIFY pgrst, 'reload schema';
