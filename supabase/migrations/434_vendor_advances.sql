-- Vendor Advances — mirrors party_advances (167, buyer-side) but for money
-- paid OUT to a supplier ahead of a bill, recoverable against future GRN /
-- Pending Payments bills. Same shape: amount vs amount_used running balance,
-- one advance row can be linked to at most one bill via advance_adjusted +
-- vendor_advance_id (matching how nhe_sales/he_dispatch link to
-- party_advances) — the ledger entry (cash_book/bank_transactions) is
-- created once, when the advance is PAID; adjusting it against a bill later
-- is not a new cash movement, so it must NOT create a second ledger entry.
CREATE TABLE IF NOT EXISTS public.vendor_advances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_date   DATE NOT NULL,
  party_id       UUID NOT NULL REFERENCES public.parties(id),
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_used    NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_mode   TEXT NOT NULL DEFAULT 'cash',
  reference_no   TEXT,
  remarks        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS advance_adjusted NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS vendor_advance_id UUID REFERENCES public.vendor_advances(id);

ALTER TABLE public.vendor_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_advances_select ON public.vendor_advances FOR SELECT TO authenticated USING (true);
CREATE POLICY vendor_advances_insert ON public.vendor_advances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendor_advances_update ON public.vendor_advances FOR UPDATE TO authenticated USING (true);
CREATE POLICY vendor_advances_delete ON public.vendor_advances FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_audit ON public.vendor_advances;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.vendor_advances
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

SELECT count(*) AS table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='vendor_advances';
SELECT count(*) AS pending_payments_cols_added FROM information_schema.columns
WHERE table_schema='public' AND table_name='pending_payments'
  AND column_name IN ('advance_adjusted','vendor_advance_id');
