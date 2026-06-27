-- Migration 183: Let opening PAYABLES (suppliers/partners) be paid & bank-linked.
-- An opening payable creates a pending_payments row (is_opening=true) so it appears in
-- Pending Payments / CMS / Waiting to Link. To avoid double-counting in Party Ledger,
-- opening bills are EXCLUDED from the 'Purchase Bill' union (the opening row already
-- carries the Cr); their 'Payment Made' still shows when paid, offsetting the opening.

ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS is_opening BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS opening_balance_id UUID REFERENCES public.opening_balances(id) ON DELETE CASCADE;

DROP VIEW IF EXISTS public.v_party_ledger;
CREATE VIEW public.v_party_ledger AS
  SELECT ob.party_id, ob.as_of_date AS txn_date, 'Opening Balance' AS txn_type,
    ob.fy AS ref_no, COALESCE(ob.remarks,'') AS narration,
    CASE WHEN ob.dr_cr = 'Dr' THEN ob.amount ELSE 0 END AS debit,
    CASE WHEN ob.dr_cr = 'Cr' THEN ob.amount ELSE 0 END AS credit,
    ob.id AS source_id, 'opening_balance' AS source_table
  FROM public.opening_balances ob WHERE ob.party_id IS NOT NULL
  UNION ALL
  SELECT pa.party_id, pa.advance_date, 'Advance Received', NULL::TEXT, COALESCE(pa.remarks,''),
    0::NUMERIC, pa.amount, pa.id, 'party_advance'
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
  FROM public.he_dispatch hd WHERE hd.party_id IS NOT NULL
  UNION ALL
  SELECT hd.party_id, hd.received_date, 'HE Payment Received', COALESCE(hd.invoice_no, hd.dc_no::TEXT),
    '', 0::NUMERIC, COALESCE(hd.amount_received, hd.amount), hd.id, 'he_payment'
  FROM public.he_dispatch hd WHERE hd.party_id IS NOT NULL AND hd.payment_status = 'Received'
  UNION ALL
  SELECT COALESCE(pp.party_id, (SELECT p.id FROM public.parties p
       WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pp.vendor_name)) LIMIT 1)),
    COALESCE(pp.grn_date, pp.invoice_date), 'Purchase Bill', COALESCE(pp.invoice_no, pp.grn_no),
    COALESCE(pp.vendor_name,''), 0::NUMERIC, COALESCE(pp.net_payable, pp.invoice_amount, 0), pp.id, 'purchase_bill'
  FROM public.pending_payments pp
  WHERE (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false)
    AND (pp.is_opening IS NULL OR pp.is_opening = false)
    AND COALESCE(pp.net_payable, pp.invoice_amount, 0) > 0
  UNION ALL
  SELECT COALESCE(pp.party_id, (SELECT p.id FROM public.parties p
       WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pp.vendor_name)) LIMIT 1)),
    COALESCE(pp.paid_date, pp.grn_date), 'Payment Made', COALESCE(pp.invoice_no, pp.grn_no),
    '', COALESCE(NULLIF(pp.paid_amount,0), pp.net_payable, pp.invoice_amount, 0), 0::NUMERIC, pp.id, 'purchase_payment'
  FROM public.pending_payments pp
  WHERE pp.payment_status = 'Paid'
    AND (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false);

SELECT 'ok' AS status;
