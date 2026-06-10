-- Migration 025: Purchase Order Receipts (stock receipt tracking)

CREATE TABLE IF NOT EXISTS public.po_receipts (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  po_id        UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  receipt_date DATE NOT NULL,
  qty_received NUMERIC(12,3),
  unit         TEXT,
  condition    TEXT DEFAULT 'Good' CHECK (condition IN ('Good','Partial','Damaged')),
  vehicle_no   TEXT,
  received_by  TEXT,
  remarks      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.po_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_po_receipts"   ON public.po_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_po_receipts" ON public.po_receipts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_po_receipts" ON public.po_receipts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_po_receipts" ON public.po_receipts FOR DELETE TO authenticated USING (true);
