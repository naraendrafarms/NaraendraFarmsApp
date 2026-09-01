-- Migration 1111: credit buyer-deducted TDS in v_party_ledger.
--
-- v_party_ledger debits an HE dispatch at its GROSS amount but credits only
-- amount_received, which for a buyer like Hitech Hatch Fresh is gross less
-- 0.1% TDS. The TDS was never credited anywhere, so every such invoice left a
-- permanent open balance in the party ledger exactly equal to its TDS, even
-- once the invoice was correctly marked Received. Measured before this change:
-- 26 HE invoices carrying 47,052 of TDS-sized residue.
--
-- This adds a 'TDS Deducted' credit line so the invoice closes out. It is the
-- ledger half of showing net-of-TDS balances in the Bank Ledger settle picker.
--
-- Over-crediting guards: the line only exists where TDS > 0, a receipt was
-- actually recorded (amount_received IS NOT NULL — the payment branch falls
-- back to crediting the full gross when it is NULL) and that receipt was short
-- of the gross. The credit is capped at the shortfall, so a receipt entered as
-- the full gross adds nothing and the ledger can never over-credit an invoice.
--
-- nhe_sales is deliberately untouched: it has no TDS column at all (verified
-- against information_schema), so there is nothing to credit on that side.
--
-- Definition below is migration 472's (the current one) plus the new branch.

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
  SELECT va.party_id, va.advance_date, 'Advance Paid', va.reference_no, COALESCE(va.remarks,''),
    va.amount, 0::NUMERIC, va.id, 'vendor_advance'
  FROM public.vendor_advances va
  WHERE va.party_id IS NOT NULL AND va.opening_balance_id IS NULL
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
  -- NEW: buyer-deducted TDS on hatching-egg invoices, capped at the shortfall.
  SELECT hd.party_id, COALESCE(hd.received_date, hd.dispatch_date), 'TDS Deducted',
    COALESCE(hd.invoice_no, hd.dc_no::TEXT),
    'TDS deducted at source by buyer',
    0::NUMERIC,
    LEAST(hd.tds_amount, hd.amount - hd.amount_received),
    hd.id, 'he_tds'
  FROM public.he_dispatch hd
  WHERE hd.party_id IS NOT NULL
    AND COALESCE(hd.tds_amount,0) > 0
    AND hd.amount_received IS NOT NULL
    AND hd.amount_received < hd.amount
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
    CASE WHEN COALESCE(pp.discount_amount,0) > 0 THEN 'incl. discount ' || pp.discount_amount ELSE '' END,
    GREATEST(0,
      COALESCE(pp.paid_amount,0) - COALESCE(pp.advance_adjusted,0) + COALESCE(pp.discount_amount,0)
    ),
    0::NUMERIC, pp.id, 'purchase_payment'
  FROM public.pending_payments pp
  WHERE pp.payment_status = 'Paid'
    AND (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false);

-- ── Verification ─────────────────────────────────────────────────────────
SELECT count(*)::int AS view_exists
FROM information_schema.views WHERE table_name = 'v_party_ledger';

-- The new branch: how many TDS lines and how much they credit.
SELECT count(*)::int AS tds_lines, COALESCE(sum(credit),0)::numeric AS tds_credited
FROM public.v_party_ledger WHERE source_table = 'he_tds';

-- No line may ever exceed its own invoice's TDS (over-credit guard).
SELECT count(*)::int AS over_credited
FROM public.v_party_ledger l
JOIN public.he_dispatch d ON d.id = l.source_id
WHERE l.source_table = 'he_tds' AND l.credit > COALESCE(d.tds_amount,0);

-- Hitech's net ledger position before vs after is expected to move by exactly
-- the TDS credited above; show the closing balance now.
SELECT COALESCE(sum(l.debit) - sum(l.credit), 0)::numeric AS hitech_closing
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.name ILIKE 'Hitech Hatch Fresh%';
