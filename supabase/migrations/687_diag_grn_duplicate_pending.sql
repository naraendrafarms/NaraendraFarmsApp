-- Diagnostic only. Two symptoms reported:
--   * More Than Solutions Pvt Ltd, Inv 589/26-27, GRN 2743, Rs 1,17,000 -- paid
--     from the bank on 29/06/2026 (CMS1802612036320) yet still showing Pending.
--   * Venco Research & Breeding Farm, Chicks, Rs 39,975 -- settled from an
--     advance yet still showing Pending.
--
-- Suspected cause, from fn_grn_to_payment: the pending payment is keyed on
-- (vendor_name, grn_no). A GRN entered WITHOUT a number creates a row keyed on
-- a blank/NULL grn_no; adding the number later makes the trigger INSERT a
-- SECOND row under the real number, leaving the first behind as Pending. The
-- payment then settles one of the two and the other stays open forever.
--
-- Read-only. Nothing is deleted or merged here.

-- 1. Every pending_payments row for these two vendors, with what has been
--    settled against it.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS rows_for_these_vendors
FROM (
  SELECT vendor_name || ' | grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
         || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
         || ' amt=' || COALESCE(invoice_amount::text,'-')
         || ' net=' || COALESCE(net_payable::text,'-')
         || ' paid=' || COALESCE(paid_amount::text,'0')
         || ' adv=' || COALESCE(advance_adjusted::text,'0')
         || ' disc=' || COALESCE(discount_amount::text,'0')
         || ' status=' || COALESCE(payment_status,'(null)') AS line
  FROM public.pending_payments
  WHERE vendor_name ILIKE '%More Than Solutions%' OR vendor_name ILIKE '%Venco Research%'
) x;

-- 2. Are there pending rows with NO grn number at all? That is the fingerprint
--    of this fault across the whole table, not just these two vendors.
SELECT COUNT(*)::text AS pending_rows_with_no_grn_no,
       COUNT(DISTINCT vendor_name)::text AS vendors_affected,
       COALESCE(SUM(COALESCE(net_payable, invoice_amount, 0))::text,'0') AS amount_sitting_open
FROM public.pending_payments
WHERE COALESCE(NULLIF(grn_no,''), NULL) IS NULL
  AND COALESCE(payment_status,'Pending') NOT IN ('Paid');

-- 3. Same vendor + same invoice appearing TWICE -- one with a grn number, one
--    without. These are the duplicate pairs the edit created.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NO DUPLICATE PAIRS') AS duplicate_pairs
FROM (
  SELECT vendor_name || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
         || ' rows=' || COUNT(*)
         || ' amounts=' || string_agg(COALESCE(invoice_amount::text,'-'), '/')
         || ' grns=' || string_agg(COALESCE(NULLIF(grn_no,''),'(blank)'), '/')
         || ' statuses=' || string_agg(COALESCE(payment_status,'(null)'), '/') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(invoice_no,''), NULL) IS NOT NULL
  GROUP BY vendor_name, invoice_no
  HAVING COUNT(*) > 1
) y;

-- 4. Money already recorded against these vendors in the bank ledger and cash
--    book -- so it is clear the payment exists even though the bill says Pending.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS settled_in_ledgers
FROM (
  SELECT 'BANK ' || to_char(txn_date,'DD/MM/YY') || ' ' || txn_type || ' ' || amount
         || ' ref=' || COALESCE(reference_no,'-') || ' :: ' || COALESCE(description,'') AS line
  FROM public.bank_transactions
  WHERE description ILIKE '%More Than Solutions%' OR description ILIKE '%Venco Research%'
  UNION ALL
  SELECT 'CASH ' || to_char(txn_date,'DD/MM/YY') || ' out=' || COALESCE(amount_out,0)
         || ' :: ' || COALESCE(description,'') AS line
  FROM public.cash_book
  WHERE party_name ILIKE '%More Than Solutions%' OR party_name ILIKE '%Venco Research%'
) z;
