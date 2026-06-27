-- Migration 179: Recreate v_party_ledger (in case it was silently dropped) + diagnostics
-- Same definition as 168. Diagnostics at the end report whether the view has rows.

DROP VIEW IF EXISTS public.v_party_ledger;

CREATE VIEW public.v_party_ledger AS
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
  WHERE hd.party_id IS NOT NULL AND hd.payment_status = 'Received';

-- ── Diagnostics ──
SELECT to_regclass('public.v_party_ledger') AS view_exists;
SELECT COUNT(*) AS total_ledger_rows FROM public.v_party_ledger;
SELECT source_table, COUNT(*) AS rows, COUNT(DISTINCT party_id) AS parties
FROM public.v_party_ledger GROUP BY source_table ORDER BY source_table;
-- How many nhe_sales / he_dispatch actually have a party_id linked?
SELECT 'nhe_sales' AS tbl, COUNT(*) AS total, COUNT(party_id) AS with_party FROM public.nhe_sales
UNION ALL
SELECT 'he_dispatch', COUNT(*), COUNT(party_id) FROM public.he_dispatch;
