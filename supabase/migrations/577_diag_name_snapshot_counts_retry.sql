-- Diagnostic only (no schema changes).
-- In 576 statements [2] and [4] printed nothing while [3] reported 6 stale
-- rows — they did not return zero, they errored on a column that does not
-- exist and run_sql.py reported success anyway. Rebuilt here using only the
-- 8 name columns information_schema actually confirmed, and probing the id
-- link columns separately so one bad guess cannot take the whole query down.

-- 1. Which of these tables actually have party_id / partner_id to link on.
SELECT string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, column_name) AS link_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('party_id', 'partner_id')
  AND table_name IN ('pending_payments','purchase_orders','grn','supplier_invoices',
                     'cash_book','bag_sales','feedmill_expenses','sales_register',
                     'vendor_bank_details','vendor_advances','party_advances');

-- 2. Stale rows per name column — the 8 confirmed columns only.
SELECT src, rows, sample FROM (
  SELECT 'pending_payments.vendor_name' AS src, COUNT(*) AS rows, MIN(vendor_name) AS sample
    FROM public.pending_payments WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'purchase_orders.vendor_name', COUNT(*), MIN(vendor_name)
    FROM public.purchase_orders WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'supplier_invoices.supplier_name', COUNT(*), MIN(supplier_name)
    FROM public.supplier_invoices WHERE supplier_name ILIKE '%parmita%'
  UNION ALL SELECT 'cash_book.party_name', COUNT(*), MIN(party_name)
    FROM public.cash_book WHERE party_name ILIKE '%parmita%'
  UNION ALL SELECT 'sales_register.party_name', COUNT(*), MIN(party_name)
    FROM public.sales_register WHERE party_name ILIKE '%parmita%'
  UNION ALL SELECT 'bag_sales.buyer_name', COUNT(*), MIN(buyer_name)
    FROM public.bag_sales WHERE buyer_name ILIKE '%parmita%'
  UNION ALL SELECT 'feedmill_expenses.vendor_name', COUNT(*), MIN(vendor_name)
    FROM public.feedmill_expenses WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'vendor_bank_details.vendor_name', COUNT(*), MIN(vendor_name)
    FROM public.vendor_bank_details WHERE vendor_name ILIKE '%parmita%'
) x WHERE rows > 0;

-- 3. Free-text sentences that embed the name (need substring replacement,
--    not whole-value replacement). Separate statement so a missing column
--    here cannot hide statement 2.
SELECT src, rows FROM (
  SELECT 'bank_transactions.description' AS src, COUNT(*) AS rows
    FROM public.bank_transactions WHERE description ILIKE '%parmita%'
  UNION ALL SELECT 'cash_book.description', COUNT(*)
    FROM public.cash_book WHERE description ILIKE '%parmita%'
) z WHERE rows > 0;

-- 4. The 6 stale bills in detail — 576 showed all 6 carry partner_id but only
--    3 carry party_id, so we need to see exactly what they are.
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, tds_amount,
       payment_status, party_id, partner_id
FROM public.pending_payments
WHERE vendor_name ILIKE '%parmita%'
ORDER BY invoice_date;

SELECT 'sentinel' AS marker, 1 AS n;
