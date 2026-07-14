-- TDS Challan master — real challan-level tracking for quarterly TDS return
-- filing (24Q salary / 26Q non-salary via RPU). Previously tds_deposited was
-- just a boolean+date per deductee row with no link to the actual challan
-- (BSR code + challan serial no + deposit date) it was paid against, so there
-- was no way to reconcile "sum of deductees tagged to a challan" against
-- "amount actually deposited on that challan" — which is exactly what RPU
-- validates before it will generate the return.

CREATE TABLE IF NOT EXISTS public.tds_challans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fy                TEXT NOT NULL,
  quarter           TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  section           TEXT,
  bsr_code          TEXT NOT NULL,
  challan_serial_no TEXT NOT NULL,
  deposit_date      DATE NOT NULL,
  tds_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  interest_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bsr_code, challan_serial_no, deposit_date)
);
ALTER TABLE public.tds_challans ENABLE ROW LEVEL SECURITY;
CREATE POLICY tds_challans_select ON public.tds_challans FOR SELECT TO authenticated USING (true);
CREATE POLICY tds_challans_insert ON public.tds_challans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY tds_challans_update ON public.tds_challans FOR UPDATE TO authenticated USING (true);
CREATE POLICY tds_challans_delete ON public.tds_challans FOR DELETE TO authenticated USING (true);
DROP TRIGGER IF EXISTS trg_audit ON public.tds_challans;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.tds_challans
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Link each deductee row (vendor bill / salary month) to the challan it was
-- actually deposited against.
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_challan_id UUID REFERENCES public.tds_challans(id) ON DELETE SET NULL;
ALTER TABLE public.salary_monthly   ADD COLUMN IF NOT EXISTS tds_challan_id UUID REFERENCES public.tds_challans(id) ON DELETE SET NULL;

-- TAN is required on every challan/return — was missing from company_settings.
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS tan_no TEXT;

-- ── Diagnostics ──────────────────────────────────────────────────────────
SELECT count(*) AS tds_challans_table_exists FROM information_schema.tables WHERE table_name='tds_challans';
SELECT count(*) AS tds_challans_cols FROM information_schema.columns
  WHERE table_name='tds_challans' AND column_name IN ('fy','quarter','section','bsr_code','challan_serial_no','deposit_date','tds_amount','interest_amount');
SELECT count(*) AS pp_challan_col FROM information_schema.columns
  WHERE table_name='pending_payments' AND column_name='tds_challan_id';
SELECT count(*) AS sm_challan_col FROM information_schema.columns
  WHERE table_name='salary_monthly' AND column_name='tds_challan_id';
SELECT count(*) AS cs_tan_col FROM information_schema.columns
  WHERE table_name='company_settings' AND column_name='tan_no';
