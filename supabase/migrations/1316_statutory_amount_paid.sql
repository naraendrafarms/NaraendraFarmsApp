-- Record what a statutory challan was ACTUALLY paid for, when it differs from
-- what the app computed.
--
-- Today the Mark Remitted form offers an amount box for advance tax and late
-- fee only. For ESI, PF, PT, TDS and GST saveRemittance forces the stored
-- figure to the app's own computed one, so a challan deposited for a few
-- rupees more or less than the app worked out cannot be recorded anywhere -
-- the table has id, liability_type, period, amount_due, status, challan_no,
-- paid_date, remarks, updated_at, created_at and the two payer columns, and
-- not one of them is "what we actually paid".
--
-- amount_paid is ADDITIVE and NULLABLE. NULL keeps the old meaning exactly:
-- paid the computed amount. Every existing row stays as it is - nothing is
-- written, defaulted or backfilled - so the four challans on record keep
-- reading as they do today.
--
-- The party ledger branch added in 1313 credited amount_due. It must credit
-- what actually left instead, or a challan paid short would still overstate
-- what the payer spent on our behalf. COALESCE keeps every pre-existing row
-- crediting exactly what it credits now.

ALTER TABLE public.statutory_liabilities
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(14,2);

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
    0::NUMERIC, COALESCE(sl.amount_paid, sl.amount_due), sl.id, 'statutory_challan'
  FROM public.statutory_liabilities sl
  WHERE sl.paid_via_party_id IS NOT NULL
    AND sl.status = 'Paid'
    AND COALESCE(sl.amount_paid, sl.amount_due, 0) > 0
    AND sl.liability_type <> 'tds_receivable';

-- ── Verification ─────────────────────────────────────────────────────────
-- run_sql.py treats "already exists" as success, so an ALTER that silently
-- did nothing would still report Errors: 0. Check the column is really there,
-- that the view survived the DROP, and that no row was touched.
SELECT (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='statutory_liabilities'
          AND column_name='amount_paid') AS amount_paid_column,
       (SELECT count(*)::int FROM information_schema.views
        WHERE table_name='v_party_ledger') AS view_exists,
       (SELECT count(*)::int FROM public.statutory_liabilities) AS liability_rows,
       (SELECT count(*)::int FROM public.statutory_liabilities
        WHERE amount_paid IS NOT NULL) AS rows_with_amount_paid_must_be_zero;

-- The ledger lines must read exactly as they did before this migration.
SELECT l.txn_date::text AS on_date, l.ref_no AS challan_no,
       round(l.credit)::int AS credit
FROM public.v_party_ledger l
WHERE l.source_table = 'statutory_challan'
ORDER BY l.txn_date;

COMMENT ON COLUMN public.statutory_liabilities.amount_paid IS
  'What the challan was actually deposited for, when it differs from the computed amount_due. NULL means it was paid exactly as computed - that is what every row written before this column existed means.';
