-- Bug in migration 462: vendor_advances was wired into v_party_ledger with
-- its amount in the CREDIT column ("Advance Paid" ... 0, va.amount) — but in
-- this view's own established convention, Credit is what INCREASES the
-- payable balance (see 'Purchase Bill': 0, net_payable) and Debit is what
-- REDUCES it (see 'Payment Made': paid_amount+discount, 0). Paying an
-- advance to a vendor is money paid out, exactly like 'Payment Made' — it
-- must be a Debit, not a Credit. The migration 462 comment even claimed
-- "CREDIT (reduces what the party owes)", which is backwards given the rest
-- of this same view — Credit increases it here, never reduces it.
--
-- This silently doubled the effect for any Dr-opening-balance-derived
-- advance (migration 469): the opening_balances row already correctly
-- reduces the payable balance (Dr -> debit), and the mirrored vendor_advances
-- row was then ADDING the same amount back via Credit, netting to zero
-- instead of showing the real balance once. It equally affects every
-- ordinary vendor advance paid through Vendor Advances — those were also
-- shown as increasing what's owed to that vendor, which is wrong.
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
SELECT count(*) AS view_exists FROM information_schema.views WHERE table_name='v_party_ledger';
SELECT debit, credit FROM public.v_party_ledger WHERE source_table = 'vendor_advance' LIMIT 5;
