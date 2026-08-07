-- Diagnostic only (no schema changes).
--
-- Renaming a master (parties / partners / employees) does not change the plain
-- text name copied onto transaction rows when they were created, so the old
-- name keeps showing everywhere. Before correcting anything we need the exact
-- list of columns that hold such a copy, and how many rows still carry the old
-- name "G Parmita Das".

-- 1. Every text column in the database whose name looks like a stored name.
--    This is the authoritative list — the fix migration will be built from it.
SELECT 'name_text_columns' AS chk, c.table_name, c.column_name, c.data_type
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
    OR c.column_name IN ('paid_to', 'received_from'))
ORDER BY c.table_name, c.column_name;

-- 2. The master rows themselves — confirm the rename actually saved, and get
--    the ids we will link against.
SELECT 'parties_match' AS chk, id, name, type, pan_no
FROM public.parties
WHERE name ILIKE '%parmita%' OR name ILIKE '%gottipati%' OR name ILIKE '%das%'
ORDER BY name;

SELECT 'partners_match' AS chk, id, name, pan
FROM public.partners
WHERE name ILIKE '%parmita%' OR name ILIKE '%gottipati%' OR name ILIKE '%das%'
ORDER BY name;

-- 3. Rows still carrying the OLD name, per table. Counted with ILIKE on the
--    distinctive part so spacing/case differences are caught too.
SELECT 'stale_pending_payments' AS chk, COUNT(*) AS rows, MIN(vendor_name) AS sample
FROM public.pending_payments WHERE vendor_name ILIKE '%parmita%';

SELECT 'stale_purchase_orders' AS chk, COUNT(*) AS rows, MIN(vendor_name) AS sample
FROM public.purchase_orders WHERE vendor_name ILIKE '%parmita%';

SELECT 'stale_grn' AS chk, COUNT(*) AS rows, MIN(vendor_name) AS sample
FROM public.grn WHERE vendor_name ILIKE '%parmita%';

SELECT 'stale_supplier_invoices' AS chk, COUNT(*) AS rows, MIN(supplier_name) AS sample
FROM public.supplier_invoices WHERE supplier_name ILIKE '%parmita%';

SELECT 'stale_cash_book' AS chk, COUNT(*) AS rows, MIN(party_name) AS sample
FROM public.cash_book WHERE party_name ILIKE '%parmita%';

-- 4. Free-text description fields also mention the vendor on bank/ledger rows.
--    These are sentences, not a name field, so they need a different treatment
--    (replace the substring, not the whole value) — count them separately.
SELECT 'stale_bank_txn_desc' AS chk, COUNT(*) AS rows, MIN(description) AS sample
FROM public.bank_transactions WHERE description ILIKE '%parmita%';

SELECT 'stale_cash_book_desc' AS chk, COUNT(*) AS rows, MIN(description) AS sample
FROM public.cash_book WHERE description ILIKE '%parmita%';

-- 5. Are those stale rows even linked to the master? If party_id/partner_id is
--    NULL, option B (read the name through the link) would show a blank, so we
--    must know how many need linking first.
SELECT 'link_coverage_pp' AS chk,
  COUNT(*) AS rows,
  COUNT(party_id) AS with_party_id,
  COUNT(partner_id) AS with_partner_id
FROM public.pending_payments WHERE vendor_name ILIKE '%parmita%';

SELECT 'sentinel' AS marker, 1 AS n;
