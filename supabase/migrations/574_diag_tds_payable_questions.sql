-- Diagnostic only (no schema changes) — several TDS Payable questions.
--
-- Code findings so far:
--  (a) The report filters AND orders on grn_date only. Purchase Invoice
--      Register mirrors invoices into pending_payments WITHOUT a grn_date
--      (it sets invoice_date), so those rows are dropped entirely whenever a
--      date/FY filter is applied — "Invoice Date is not taking".
--  (b) PAN is read as parties.pan_no ?? employees.pan_no. The partners table
--      is joined for deductee_type ONLY, never for PAN — so a partner's PAN
--      can never appear, which also explains partner TDS/PAN not updating.

-- 1. Does partners even have a PAN column?
SELECT 'partners_cols' AS chk, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='partners'
  AND (column_name ILIKE '%pan%' OR column_name ILIKE '%tds%' OR column_name ILIKE '%deductee%')
ORDER BY column_name;

-- 2. How many TDS-bearing bills have NO grn_date (invisible once filtered)
SELECT 'no_grn_date' AS chk, COUNT(*) AS bills, SUM(tds_amount) AS tds_hidden
FROM public.pending_payments
WHERE COALESCE(tds_amount,0) > 0 AND grn_date IS NULL;

-- 3. Om Prakash Singh: every pending_payments row (the 3-vs-4 question)
SELECT 'om_prakash_bills' AS chk, id, vendor_name, invoice_no, grn_no,
  invoice_date, grn_date, invoice_amount, tds_amount, payment_status,
  party_id, partner_id, category
FROM public.pending_payments
WHERE vendor_name ILIKE '%Prakash%'
ORDER BY invoice_date;

-- 4. And what the Purchase Invoice Register itself holds for him
SELECT 'om_prakash_invoices' AS chk, si.id, si.invoice_no, si.invoice_date,
  si.supplier_name, p.name AS party_name, si.total_amount, si.tds_amount, si.payment_status
FROM public.supplier_invoices si
LEFT JOIN public.parties p ON p.id = si.party_id
WHERE si.supplier_name ILIKE '%Prakash%' OR p.name ILIKE '%Prakash%'
ORDER BY si.invoice_date;

-- 5. Partner-linked bills with TDS in Jul 2026 (the partner TDS question)
SELECT 'partner_tds_july' AS chk, pp.vendor_name, pp.invoice_no, pp.invoice_date,
  pp.grn_date, pp.tds_amount, pp.partner_id, pt.name AS partner_name
FROM public.pending_payments pp
LEFT JOIN public.partners pt ON pt.id = pp.partner_id
WHERE pp.partner_id IS NOT NULL
  AND COALESCE(pp.invoice_date, pp.grn_date) BETWEEN '2026-07-01' AND '2026-07-31'
ORDER BY pp.invoice_date;

SELECT 'sentinel' AS marker, 1 AS n;
