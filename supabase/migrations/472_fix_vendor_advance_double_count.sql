-- Migration 471 fixed vendor_advances' sign (Credit -> Debit) but missed two
-- double-counting cases the audit found:
--
-- 1. A Dr opening balance on a supplier (migration 469) auto-creates a
--    mirrored vendor_advances row. Both the 'Opening Balance' branch (Dr ->
--    debit) AND the 'Advance Paid' branch now show the SAME money as a
--    Debit — doubling it instead of showing it once. Exclude any
--    vendor_advances row that's linked back to an opening balance
--    (opening_balance_id IS NOT NULL) from the Advance Paid branch; the
--    Opening Balance branch already represents that exact amount.
--
-- 2. When a bill is settled from an advance (Pending Payments "Advance"
--    payment mode), pending_payments.paid_amount is incremented by the
--    adjusted amount and advance_adjusted/vendor_advance_id are set — but
--    no new cash actually moved (the money already left when the advance
--    itself was paid). The 'Payment Made' branch used full paid_amount,
--    so once an advance is adjusted against a bill, that amount is shown
--    as Debit twice: once as the original Advance Paid, once again inside
--    Payment Made. Subtract advance_adjusted back out of Payment Made's
--    debit so only cash that actually left this time is shown there.
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

-- ── Diagnostics ──────────────────────────────────────────────────────────
SELECT count(*) AS view_exists FROM information_schema.views WHERE table_name='v_party_ledger';
-- Venco duplicate-opening / orphan-advance check
SELECT ob.id, ob.fy, ob.amount, ob.dr_cr, ob.party_id
  FROM public.opening_balances ob
  JOIN public.parties p ON p.id = ob.party_id
  WHERE p.name ILIKE '%Venco%';
SELECT va.id, va.amount, va.amount_used, va.opening_balance_id, va.party_id
  FROM public.vendor_advances va
  JOIN public.parties p ON p.id = va.party_id
  WHERE p.name ILIKE '%Venco%';
