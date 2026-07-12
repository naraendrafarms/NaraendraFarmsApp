-- Purchase Intent (indent) — new optional stage BEFORE Purchase Order, matching
-- the real paper/Excel "INDENT FOR NARAENDRA BREEDING FARMS" format already in
-- use: header (intent date, requesting site, prepared/approved by) + line items
-- (require for, item, qty, pack size, UOM, total, best-delivery-by).
--
-- Three separate, independently-named documents, each tracked on its own:
-- Purchase Intent (this table) -> Purchase Order (purchase_orders, unchanged
-- naming) -> GRN (grn, unchanged naming). Linking is via a nullable FK on
-- purchase_orders, not a shared number series — a PO never has to reference
-- an intent (optional), and one intent LINE can be split across multiple
-- POs (ordered_qty tracks the running total already ordered against it).
CREATE TABLE IF NOT EXISTS public.purchase_intents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_no      TEXT NOT NULL,
  intent_date    DATE NOT NULL,
  farm_id        UUID REFERENCES public.farms(id),
  prepared_by    TEXT,
  approved_by    TEXT,
  remarks        TEXT,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','closed','cancelled')),
  created_by     UUID REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_intent_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id        UUID NOT NULL REFERENCES public.purchase_intents(id) ON DELETE CASCADE,
  sl_no            INTEGER NOT NULL DEFAULT 1,
  require_for      TEXT,
  item_id          UUID REFERENCES public.items(id),
  item_name        TEXT NOT NULL,
  require_qty      NUMERIC(12,3) NOT NULL DEFAULT 0,
  pack_size        NUMERIC(12,3),
  uom              TEXT,
  total_qty        NUMERIC(14,3),
  best_delivery_by DATE,
  supplier_party_id UUID REFERENCES public.parties(id),
  ordered_qty      NUMERIC(12,3) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','ordered','cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_intent_lines_intent ON public.purchase_intent_lines (intent_id);
CREATE INDEX IF NOT EXISTS idx_purchase_intent_lines_status ON public.purchase_intent_lines (status);

-- Optional link from a PO line back to the intent line it was raised
-- against. Nullable — a PO never requires an intent. Many POs can point at
-- the same intent_line_id, which is exactly how one intent line splits
-- across multiple POs.
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS intent_line_id UUID REFERENCES public.purchase_intent_lines(id);

ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_intents_select ON public.purchase_intents FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_intents_insert ON public.purchase_intents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_intents_update ON public.purchase_intents FOR UPDATE TO authenticated USING (true);
CREATE POLICY purchase_intents_delete ON public.purchase_intents FOR DELETE TO authenticated USING (true);

ALTER TABLE public.purchase_intent_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_intent_lines_select ON public.purchase_intent_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_intent_lines_insert ON public.purchase_intent_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_intent_lines_update ON public.purchase_intent_lines FOR UPDATE TO authenticated USING (true);
CREATE POLICY purchase_intent_lines_delete ON public.purchase_intent_lines FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_audit ON public.purchase_intents;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.purchase_intents
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.purchase_intent_lines;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.purchase_intent_lines
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

SELECT count(*) AS tables_created FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('purchase_intents','purchase_intent_lines');
SELECT count(*) AS po_col_added FROM information_schema.columns
WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='intent_line_id';
