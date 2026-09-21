-- Show a statutory challan paid by another party in THAT party's ledger.
--
-- What happens today: you transfer money to Hitech, which is recorded as
-- Advance Paid - a DEBIT in their party ledger. They then remit our ESI, PF,
-- advance tax or GST challan and you mark it paid "via" them on the Statutory
-- Compliance Center. That mark is stored, and the page shows "via <name>", but
-- the challan reaches NO ledger anywhere: v_party_ledger is built from ten
-- sources and statutory_liabilities is not one of them. So the advance sits
-- open for ever and the ledger cannot answer the only question that matters -
-- how much of our money is still lying with them.
--
-- Measured before this change (21/09/2026):
--   Hitech Hatch Fresh Private Limited Advance - 4 Advance Paid debits
--   totalling 49,20,376, no credits, closing 49,20,376.
--   Four challans paid by them totalling 50,92,778 appear nowhere:
--     Advance Tax Jun 2026  25,00,000   challan 27221
--     ESI         Aug 2026      11,774   challan 05226139616555
--     PF          Aug 2026      81,004   challan 2609120351180
--     Advance Tax Sep 2026  25,00,000   challan 21052
--   After this change that party closes at 49,20,376 - 50,92,778 = -1,72,402,
--   i.e. they have paid 1,72,402 more on our behalf than we have sent them.
--
-- The challan is a CREDIT, using up the advance. No bank or cash entry is
-- created and none should be: our bank was not touched on the challan date,
-- the money left when we transferred it, and that transfer is already in this
-- ledger. The original decision not to post to the bank was right; it was only
-- wrong to apply it to the party ledger as well.
--
-- NO DATA IS WRITTEN. This replaces a view and nothing else - no INSERT, no
-- UPDATE, no DELETE. Every underlying row is untouched, so it is reversible by
-- restoring the previous definition (migration 1111).
--
-- Definition below is migration 1111's, unchanged, plus the new branch.

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
    AND (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false)
  UNION ALL
  -- NEW: a statutory challan another party remitted on our behalf.
  -- COALESCE on the date because a liability can be marked Paid with the date
  -- left blank, and a NULL txn_date would be dropped by the ledger's own date
  -- filters without a trace. tds_receivable is excluded deliberately: it is
  -- money owed TO us, not a payment made for us, so it has no place on this
  -- side of the ledger.
  SELECT sl.paid_via_party_id, COALESCE(sl.paid_date, sl.period), 'Statutory Challan',
    sl.challan_no,
    CASE sl.liability_type
      WHEN 'esi_payable' THEN 'ESI'
      WHEN 'pf_payable'  THEN 'PF'
      WHEN 'pt_payable'  THEN 'Professional Tax'
      WHEN 'tds_payable' THEN 'TDS'
      WHEN 'gst_payable' THEN 'GST'
      WHEN 'advance_tax' THEN 'Advance Tax'
      WHEN 'late_fee'    THEN 'Late Fee / Interest'
      ELSE sl.liability_type
    END || ' ' || to_char(sl.period, 'Mon YYYY') || ' - remitted on our behalf',
    0::NUMERIC, sl.amount_due, sl.id, 'statutory_challan'
  FROM public.statutory_liabilities sl
  WHERE sl.paid_via_party_id IS NOT NULL
    AND sl.status = 'Paid'
    AND COALESCE(sl.amount_due, 0) > 0
    AND sl.liability_type <> 'tds_receivable';

-- ── Verification ─────────────────────────────────────────────────────────
-- The view must exist and the new branch must produce exactly the four known
-- challans. If the CREATE had failed, view_exists would be 0 and the Party
-- Ledger would be broken - that is what this statement is here to catch.
SELECT (SELECT count(*)::int FROM information_schema.views
        WHERE table_name = 'v_party_ledger') AS view_exists,
       count(*)::int AS statutory_lines,
       round(COALESCE(sum(credit),0))::int AS credited,
       round(COALESCE(sum(debit),0))::int  AS debited_must_be_zero
FROM public.v_party_ledger WHERE source_table = 'statutory_challan';

-- Every party that now carries a challan line, with its closing balance.
SELECT p.name,
       count(l.*)::int AS lines,
       round(sum(l.debit) - sum(l.credit))::int AS closing
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.id IN (SELECT paid_via_party_id FROM public.statutory_liabilities
               WHERE paid_via_party_id IS NOT NULL)
GROUP BY p.name ORDER BY p.name;

-- The challan lines themselves, as they will read on screen.
SELECT l.txn_date::text AS on_date, l.ref_no AS challan_no, l.narration,
       round(l.credit)::int AS credit
FROM public.v_party_ledger l
WHERE l.source_table = 'statutory_challan'
ORDER BY l.txn_date;
