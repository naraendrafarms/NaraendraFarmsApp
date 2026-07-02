-- Unified statutory liability tracker — the piece missing from every statutory
-- report (TDS Payable, TDS Receivable, GST, PF, ESI, PT): a place to record
-- that a liability was actually REMITTED to the government (challan/ack no,
-- deposit date), separate from "was the underlying bill/sale/salary paid".
CREATE TABLE IF NOT EXISTS public.statutory_liabilities (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  liability_type TEXT NOT NULL CHECK (liability_type IN
                   ('tds_payable','tds_receivable','gst_payable','pf_payable','esi_payable','pt_payable')),
  period         DATE NOT NULL,               -- first of the month this liability belongs to
  amount_due     NUMERIC(14,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Filed','Paid')),
  challan_no     TEXT,                        -- bank challan / GSTR ARN / ECR ack no / Form 16A ref
  paid_date      DATE,
  remarks        TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (liability_type, period)
);

ALTER TABLE public.statutory_liabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS statutory_liabilities_all ON public.statutory_liabilities;
CREATE POLICY statutory_liabilities_all ON public.statutory_liabilities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.statutory_liabilities TO authenticated;

-- Diagnostic
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='statutory_liabilities'
ORDER BY ordinal_position;
