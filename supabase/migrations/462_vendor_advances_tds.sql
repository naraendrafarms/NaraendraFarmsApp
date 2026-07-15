-- TDS on Vendor Advances — mirrors the same fields already added to
-- pending_payments / salary_monthly (migrations 456, 459, 460), tagging into
-- the SAME tds_challans table rather than a separate challan concept.
-- vendor_advances.amount stays the GROSS advance (ledger/reporting need the
-- full economic value paid); the app computes net = amount - tds_amount for
-- the actual cash_book/bank_transactions money-movement rows.
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_section TEXT;
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_interest NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_deposited BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_deposit_date DATE;
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS tds_challan_id UUID REFERENCES public.tds_challans(id) ON DELETE SET NULL;

-- ── v_party_ledger — wire vendor_advances in as a CREDIT (reduces what the
-- party owes) at the GROSS amount (not net-of-TDS): TDS withheld is still
-- economic value transferred to the party, just remitted to the government
-- on their behalf rather than paid in cash/bank.
--
-- NOTE on pending_payments "Payment Made" branch below: left UNCHANGED.
-- Checked whether it needs a TDS-net adjustment analogous to this one — it
-- does NOT: paid_amount there is already the actual net cash/bank amount
-- paid out (TDS is deducted before the money-movement row is written, same
-- as vendor_advances now does), and the branch already adds back
-- discount_amount as a separate non-cash credit (a discount, unlike TDS, is
-- not money that left the business at all, so it correctly gets added back
-- on top of paid_amount to fully offset the Purchase Bill debit). So no
-- analogous bug exists there.
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
    0::NUMERIC, va.amount, va.id, 'vendor_advance'
  FROM public.vendor_advances va WHERE va.party_id IS NOT NULL
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
    CASE WHEN COALESCE(pp.discount_amount,0) > 0 THEN 'incl. discount ' || pp.discount_amount ELSE '' END,
    CASE WHEN COALESCE(pp.paid_amount,0) + COALESCE(pp.discount_amount,0) > 0
         THEN COALESCE(pp.paid_amount,0) + COALESCE(pp.discount_amount,0)
         ELSE COALESCE(pp.net_payable, pp.invoice_amount, 0)
    END,
    0::NUMERIC, pp.id, 'purchase_payment'
  FROM public.pending_payments pp
  WHERE pp.payment_status = 'Paid'
    AND (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false);

-- ── Diagnostics ──────────────────────────────────────────────────────────
SELECT 'sentinel' AS marker, 1 AS n;
SELECT count(*) AS va_tds_cols FROM information_schema.columns
  WHERE table_name='vendor_advances' AND column_name IN
    ('tds_pct','tds_amount','tds_section','tds_interest','tds_deposited','tds_deposit_date','tds_challan_id');
SELECT count(*) AS view_exists FROM information_schema.views WHERE table_name='v_party_ledger';
SELECT count(*) AS ledger_rows_from_vendor_advance FROM public.v_party_ledger WHERE source_table = 'vendor_advance';
