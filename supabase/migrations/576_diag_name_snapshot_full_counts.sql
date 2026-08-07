-- Diagnostic only (no schema changes).
-- 575 confirmed both masters are renamed correctly (parties + partners =
-- "Gottipati Parmita Das") and that pending_payments still holds 6 rows with
-- the old text. run_sql.py only echoes the first 5 statements, so the rest of
-- 575's checks never printed. Everything is folded into single UNION queries
-- here so nothing is lost.

-- 1. The complete list of stored-name text columns (575 found 8, printed 5).
SELECT string_agg(c.table_name || '.' || c.column_name, ', ' ORDER BY c.table_name, c.column_name) AS all_name_columns
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = 'public' AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
WHERE c.table_schema = 'public'
  AND c.data_type IN ('text', 'character varying')
  AND (c.column_name ILIKE '%vendor%name%'
    OR c.column_name ILIKE '%party%name%'
    OR c.column_name ILIKE '%supplier%name%'
    OR c.column_name ILIKE '%partner%name%'
    OR c.column_name ILIKE '%buyer%name%'
    OR c.column_name ILIKE '%customer%name%'
    OR c.column_name ILIKE '%employee%name%'
    OR c.column_name IN ('paid_to', 'received_from'));

-- 2. Stale-row counts across every table that stores a name copy, plus the
--    free-text description fields that mention the vendor inside a sentence.
SELECT src, rows, sample FROM (
  SELECT 'pending_payments.vendor_name' AS src, COUNT(*) AS rows, MIN(vendor_name) AS sample
    FROM public.pending_payments WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'purchase_orders.vendor_name', COUNT(*), MIN(vendor_name)
    FROM public.purchase_orders WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'grn.vendor_name', COUNT(*), MIN(vendor_name)
    FROM public.grn WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'supplier_invoices.supplier_name', COUNT(*), MIN(supplier_name)
    FROM public.supplier_invoices WHERE supplier_name ILIKE '%parmita%'
  UNION ALL SELECT 'cash_book.party_name', COUNT(*), MIN(party_name)
    FROM public.cash_book WHERE party_name ILIKE '%parmita%'
  UNION ALL SELECT 'bag_sales.buyer_name', COUNT(*), MIN(buyer_name)
    FROM public.bag_sales WHERE buyer_name ILIKE '%parmita%'
  UNION ALL SELECT 'feedmill_expenses.vendor_name', COUNT(*), MIN(vendor_name)
    FROM public.feedmill_expenses WHERE vendor_name ILIKE '%parmita%'
  UNION ALL SELECT 'bank_transactions.description', COUNT(*), MIN(description)
    FROM public.bank_transactions WHERE description ILIKE '%parmita%'
  UNION ALL SELECT 'cash_book.description', COUNT(*), MIN(description)
    FROM public.cash_book WHERE description ILIKE '%parmita%'
  UNION ALL SELECT 'vendor_advances.remarks', COUNT(*), MIN(remarks)
    FROM public.vendor_advances WHERE remarks ILIKE '%parmita%'
) x WHERE rows > 0;

-- 3. Do the 6 stale pending_payments rows carry the id link? This decides
--    whether reading the name through the link (option B) would show a blank.
SELECT COUNT(*) AS stale_rows,
       COUNT(party_id) AS with_party_id,
       COUNT(partner_id) AS with_partner_id
FROM public.pending_payments WHERE vendor_name ILIKE '%parmita%';

-- 4. The wider picture: how many rows across the whole app have a name copy
--    but NO id link at all. Those are the ones a link-based display would
--    break, so they must be linked before option B is safe.
SELECT src, unlinked FROM (
  SELECT 'pending_payments' AS src, COUNT(*) AS unlinked FROM public.pending_payments
    WHERE party_id IS NULL AND partner_id IS NULL AND COALESCE(trim(vendor_name),'') <> ''
  UNION ALL SELECT 'purchase_orders', COUNT(*) FROM public.purchase_orders
    WHERE party_id IS NULL AND COALESCE(trim(vendor_name),'') <> ''
  UNION ALL SELECT 'grn', COUNT(*) FROM public.grn
    WHERE party_id IS NULL AND COALESCE(trim(vendor_name),'') <> ''
  UNION ALL SELECT 'supplier_invoices', COUNT(*) FROM public.supplier_invoices
    WHERE party_id IS NULL AND COALESCE(trim(supplier_name),'') <> ''
) y;

SELECT 'sentinel' AS marker, 1 AS n;
