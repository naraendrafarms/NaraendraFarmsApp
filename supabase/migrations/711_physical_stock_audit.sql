-- Migration 711: Physical Stock Audit
--
-- Counting stock physically had no home in the app. The only way to correct a
-- balance was Inventory > Adjustments, which asks for the DIFFERENCE (a number
-- the office had to work out by hand, against today's balance rather than the
-- balance on the day of the count), and nothing it wrote ever reached flock
-- expenditure. This adds the count itself as a record: book stock as on the
-- audit date, the counted quantity, and the difference valued at the weighted
-- average rate — for EVERY item category, not only feed ingredients.
--
-- Posting an audit writes one feed_stock_adjustments row per differing item
-- (dated to the audit date), which the existing trg_adj_stock_ledger turns into
-- an adjustment_in / adjustment_out in stock_ledger, plus farm_expenses rows
-- carrying the shortage value onto flocks in proportion to the feed each flock
-- received during the audit period.

CREATE TABLE IF NOT EXISTS public.stock_audits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date       DATE NOT NULL,
  period_from      DATE,                       -- start of the period the shortage belongs to
  farm_id          UUID REFERENCES public.farms(id),
  category         TEXT,                       -- NULL = every category
  title            TEXT,
  status           TEXT NOT NULL DEFAULT 'draft',   -- draft | posted
  valuation_method TEXT NOT NULL DEFAULT 'weighted_avg',
  allocation_method TEXT NOT NULL DEFAULT 'feed_share',
  short_value      NUMERIC(14,2) DEFAULT 0,
  excess_value     NUMERIC(14,2) DEFAULT 0,
  posted_at        TIMESTAMPTZ,
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_audit_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id     UUID NOT NULL REFERENCES public.stock_audits(id) ON DELETE CASCADE,
  item_id      UUID REFERENCES public.items(id) ON DELETE SET NULL,
  item_name    TEXT NOT NULL,
  category     TEXT,
  unit         TEXT,
  book_qty     NUMERIC(14,3) NOT NULL DEFAULT 0,   -- as on audit_date, frozen at entry
  counted_qty  NUMERIC(14,3) NOT NULL DEFAULT 0,
  diff_qty     NUMERIC(14,3) NOT NULL DEFAULT 0,   -- counted - book (negative = shortage)
  rate         NUMERIC(14,4) DEFAULT 0,            -- weighted average as on audit_date
  diff_value   NUMERIC(14,2) DEFAULT 0,
  adj_id       UUID,                               -- feed_stock_adjustments row written on post
  remarks      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sal_audit ON public.stock_audit_lines(audit_id);

-- Expense rows raised by an audit are tagged so unposting can take them back
-- out again. Without this the only way to undo a wrong count would be to hunt
-- the expenses down by hand.
ALTER TABLE public.farm_expenses
  ADD COLUMN IF NOT EXISTS stock_audit_id UUID;

ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stock_audit_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.stock_audits FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

CREATE POLICY "auth_all" ON public.stock_audit_lines FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

-- Deleting an audit must take its stock adjustments with it, or the correction
-- stays in the ledger with nothing left to explain it. A trigger rather than a
-- FK cascade, because ALTER TABLE ADD CONSTRAINT fails silently through the
-- migration runner.
CREATE OR REPLACE FUNCTION public.fn_del_stock_audit()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  DELETE FROM public.feed_stock_adjustments a
   WHERE a.id IN (SELECT l.adj_id FROM public.stock_audit_lines l
                   WHERE l.audit_id = OLD.id AND l.adj_id IS NOT NULL);
  DELETE FROM public.farm_expenses e WHERE e.stock_audit_id = OLD.id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_del_stock_audit error: %', SQLERRM;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_del_stock_audit ON public.stock_audits;

CREATE TRIGGER trg_del_stock_audit
  BEFORE DELETE ON public.stock_audits
  FOR EACH ROW EXECUTE FUNCTION public.fn_del_stock_audit();

NOTIFY pgrst, 'reload schema';
