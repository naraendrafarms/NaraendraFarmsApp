-- party_advances: records advances received from buyers
CREATE TABLE IF NOT EXISTS public.party_advances (
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

-- allow adjusting advance on nhe_sales
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS advance_adjusted NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS party_advance_id UUID REFERENCES public.party_advances(id);

-- allow adjusting advance on he_dispatch
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS advance_adjusted NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.he_dispatch ADD COLUMN IF NOT EXISTS party_advance_id UUID REFERENCES public.party_advances(id);

-- view: party ledger combining all debit/credit lines for a party
CREATE OR REPLACE VIEW public.v_party_ledger AS
  -- advances received from buyers (credit — party owes us less)
  SELECT
    pa.party_id,
    pa.advance_date                   AS txn_date,
    'Advance Received'                AS txn_type,
    NULL::TEXT                        AS ref_no,
    COALESCE(pa.remarks,'')           AS narration,
    0::NUMERIC                        AS debit,
    pa.amount                         AS credit,
    pa.id                             AS source_id,
    'party_advance'                   AS source_table
  FROM public.party_advances pa

  UNION ALL

  -- NHE sales billed to party (debit — party owes us)
  SELECT
    ns.party_id,
    ns.sale_date,
    'NHE Sale',
    ns.invoice_no,
    COALESCE(ns.sale_type,''),
    ns.amount,
    0::NUMERIC,
    ns.id,
    'nhe_sales'
  FROM public.nhe_sales ns
  WHERE ns.party_id IS NOT NULL
    AND (ns.is_employee_sale IS NULL OR ns.is_employee_sale = false)

  UNION ALL

  -- NHE payments received (credit)
  SELECT
    ns.party_id,
    ns.payment_date,
    'NHE Payment Received',
    ns.invoice_no,
    '',
    0::NUMERIC,
    COALESCE(ns.amount_received, ns.amount),
    ns.id,
    'nhe_payment'
  FROM public.nhe_sales ns
  WHERE ns.party_id IS NOT NULL
    AND ns.payment_status = 'Received'
    AND (ns.is_employee_sale IS NULL OR ns.is_employee_sale = false)

  UNION ALL

  -- HE dispatch billed to party (debit)
  SELECT
    hd.party_id,
    hd.dispatch_date,
    'HE Dispatch',
    hd.invoice_no,
    COALESCE(hd.remarks,''),
    hd.total_amount,
    0::NUMERIC,
    hd.id,
    'he_dispatch'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL

  UNION ALL

  -- HE payments received (credit)
  SELECT
    hd.party_id,
    hd.payment_date,
    'HE Payment Received',
    hd.invoice_no,
    '',
    0::NUMERIC,
    COALESCE(hd.amount_received, hd.total_amount),
    hd.id,
    'he_payment'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL
    AND hd.payment_status = 'Received';
