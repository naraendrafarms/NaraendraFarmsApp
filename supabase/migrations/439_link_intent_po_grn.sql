-- Complete the traceable chain: Purchase Intent -> Purchase Order -> GRN.
-- Each stage keeps its OWN independent item_name (e.g. "IBH Killed" on the
-- Intent, "IBH Killed VAC" + Dose on the PO, the full formal invoice name on
-- the GRN) — these are never synced or forced to match. What's added here is
-- the ID-level link so the app can trace one to the other regardless of how
-- differently each stage names the same product.
--
-- purchase_orders.intent_line_id already exists (437) — this migration adds
-- the missing GRN -> PO link (grn had NO po_id at all) and a dedicated Dose
-- field on purchase_orders (previously the dose had to be embedded in the
-- free-text item_name, e.g. "IBH Killed VAC 1000 Dose").
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES public.purchase_orders(id);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS dose TEXT;

CREATE INDEX IF NOT EXISTS idx_grn_po_id ON public.grn(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_po_intent_line_id ON public.purchase_orders(intent_line_id) WHERE intent_line_id IS NOT NULL;

SELECT count(*) AS grn_po_id_added FROM information_schema.columns
WHERE table_schema='public' AND table_name='grn' AND column_name='po_id';
SELECT count(*) AS po_dose_added FROM information_schema.columns
WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='dose';
