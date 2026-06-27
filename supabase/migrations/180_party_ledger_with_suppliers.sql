-- Migration 180: Extend v_party_ledger to cover SUPPLIERS too (purchases + payments made),
-- in addition to the existing buyer side (sales, dispatch, advances, receipts).
-- Sign convention (page): debit = party owes us; credit = we owe party / reduces their dues.
--   Purchase bill (we owe supplier)  → credit
--   Payment made to supplier         → debit
-- pending_payments.party_id may be NULL → resolve via vendor_name → parties.name.

DROP VIEW IF EXISTS public.v_party_ledger;

CREATE VIEW public.v_party_ledger AS
  -- ── BUYER SIDE ──
  SELECT pa.party_id, pa.advance_date AS txn_date, 'Advance Received' AS txn_type,
    NULL::TEXT AS ref_no, COALESCE(pa.remarks,'') AS narration,
    0::NUMERIC AS debit, pa.amount AS credit, pa.id AS source_id, 'party_advance' AS source_table
  FROM public.party_advances pa
  UNION ALL
  SELECT ns.party_id, ns.sale_date, 'NHE Sale', COALESCE(ns.invoice_no, ns.dc_no),
    COALESCE(ns.sale_type,''), ns.amount, 0::NUMERIC, ns.id, 'nhe_sales'
  FROM public.nhe_sales ns
  WHERE ns.party_id IS NOT NULL AND (ns.is_employee_sale IS NULL OR ns.is_employee_sale = false)
  UNION ALL
  SELECT ns.party_id, ns.received_date, 'NHE Payment Received', COALESCE(ns.invoice_no, ns.dc_no),
    '', 0::NUMERIC, COALESCE(ns.amount_received, ns.amount), ns.id, 'nhe_payment'
  FROM public.nhe_sales ns
  WHERE ns.party_id IS NOT NULL AND ns.payment_status = 'Received'
    AND (ns.is_employee_sale IS NULL OR ns.is_employee_sale = false)
  UNION ALL
  SELECT hd.party_id, hd.dispatch_date, 'HE Dispatch', COALESCE(hd.invoice_no, hd.dc_no::TEXT),
    COALESCE(hd.remarks,''), hd.amount, 0::NUMERIC, hd.id, 'he_dispatch'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL
  UNION ALL
  SELECT hd.party_id, hd.received_date, 'HE Payment Received', COALESCE(hd.invoice_no, hd.dc_no::TEXT),
    '', 0::NUMERIC, COALESCE(hd.amount_received, hd.amount), hd.id, 'he_payment'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL AND hd.payment_status = 'Received'

  UNION ALL
  -- ── SUPPLIER SIDE ──
  -- Purchase bill (we owe supplier) → credit
  SELECT
    COALESCE(pp.party_id, (SELECT p.id FROM public.parties p
       WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pp.vendor_name)) LIMIT 1)) AS party_id,
    COALESCE(pp.grn_date, pp.invoice_date) AS txn_date,
    'Purchase Bill', COALESCE(pp.invoice_no, pp.grn_no), COALESCE(pp.vendor_name,''),
    0::NUMERIC, COALESCE(pp.net_payable, pp.invoice_amount, 0), pp.id, 'purchase_bill'
  FROM public.pending_payments pp
  WHERE (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false)
    AND COALESCE(pp.net_payable, pp.invoice_amount, 0) > 0
  UNION ALL
  -- Payment made to supplier → debit
  SELECT
    COALESCE(pp.party_id, (SELECT p.id FROM public.parties p
       WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pp.vendor_name)) LIMIT 1)) AS party_id,
    COALESCE(pp.paid_date, pp.grn_date) AS txn_date,
    'Payment Made', COALESCE(pp.invoice_no, pp.grn_no), '',
    COALESCE(NULLIF(pp.paid_amount,0), pp.net_payable, pp.invoice_amount, 0), 0::NUMERIC,
    pp.id, 'purchase_payment'
  FROM public.pending_payments pp
  WHERE pp.payment_status = 'Paid'
    AND (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false);

-- Diagnostics
SELECT source_table, COUNT(*) AS rows, COUNT(DISTINCT party_id) AS parties
FROM public.v_party_ledger GROUP BY source_table ORDER BY source_table;
