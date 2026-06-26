-- Fix v_party_ledger: wrong column names (payment_date→received_date, total_amount→amount)
DROP VIEW IF EXISTS public.v_party_ledger;

CREATE VIEW public.v_party_ledger AS
  -- advances received from buyers (credit)
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

  -- NHE sales billed to party (debit)
  SELECT
    ns.party_id,
    ns.sale_date,
    'NHE Sale',
    COALESCE(ns.invoice_no, ns.dc_no),
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
    ns.received_date,
    'NHE Payment Received',
    COALESCE(ns.invoice_no, ns.dc_no),
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
    COALESCE(hd.invoice_no, hd.dc_no::TEXT),
    COALESCE(hd.remarks,''),
    hd.amount,
    0::NUMERIC,
    hd.id,
    'he_dispatch'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL

  UNION ALL

  -- HE payments received (credit)
  SELECT
    hd.party_id,
    hd.received_date,
    'HE Payment Received',
    COALESCE(hd.invoice_no, hd.dc_no::TEXT),
    '',
    0::NUMERIC,
    COALESCE(hd.amount_received, hd.amount),
    hd.id,
    'he_payment'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL
    AND hd.payment_status = 'Received';
