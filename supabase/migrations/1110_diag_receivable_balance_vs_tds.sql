-- Migration 1110: read-only. Does the Bank Ledger's gross (pre-TDS) invoice
-- balance already leave TDS-sized residuals on settled HE/NHE invoices?

-- 1. HE invoices that are Partial with a balance within a rupee of their TDS.
SELECT count(*)::int                                   AS he_partial_rows,
       count(*) FILTER (WHERE abs((amount - COALESCE(amount_received,0)) - COALESCE(tds_amount,0)) <= 1)::int
                                                       AS balance_equals_tds,
       COALESCE(sum(amount - COALESCE(amount_received,0)) FILTER (
         WHERE abs((amount - COALESCE(amount_received,0)) - COALESCE(tds_amount,0)) <= 1), 0)::numeric
                                                       AS stuck_value
FROM public.he_dispatch
WHERE COALESCE(amount_received,0) > 0
  AND COALESCE(amount_received,0) < amount;

-- 2. Sample of those rows.
SELECT string_agg(x.line, ' | ' ORDER BY x.line) AS sample
FROM (
  SELECT COALESCE(invoice_no, dc_no::text) || ': amt=' || amount
         || ' recd=' || COALESCE(amount_received,0)
         || ' bal=' || (amount - COALESCE(amount_received,0))
         || ' tds=' || COALESCE(tds_amount,0)
         || ' st=' || COALESCE(payment_status,'null') AS line
  FROM public.he_dispatch
  WHERE COALESCE(amount_received,0) > 0
    AND COALESCE(amount_received,0) < amount
  ORDER BY received_date DESC NULLS LAST
  LIMIT 12
) x;

-- 3. Same question for NHE sales (does nhe_sales even carry a TDS column?).
SELECT string_agg(column_name, ', ' ORDER BY column_name) AS nhe_tds_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nhe_sales' AND column_name LIKE '%tds%';

-- 4. Hitech's four open invoices from the screenshot: gross vs TDS.
SELECT string_agg(y.line, ' | ' ORDER BY y.line) AS hitech_open
FROM (
  SELECT COALESCE(d.invoice_no, d.dc_no::text) || ': amt=' || d.amount
         || ' tds=' || COALESCE(d.tds_amount,0)
         || ' pct=' || COALESCE(d.tds_pct,0)
         || ' recd=' || COALESCE(d.amount_received,0) AS line
  FROM public.he_dispatch d
  JOIN public.parties p ON p.id = d.party_id
  WHERE p.name ILIKE 'Hitech Hatch Fresh%'
    AND COALESCE(d.payment_status,'') <> 'Received'
  ORDER BY d.amount DESC
  LIMIT 10
) y;
