-- Diagnostic only. Four vendors show bills as Pending that are already paid.
--
-- My earlier scan grouped on (vendor_name, grn_no) and reported none. That was
-- the wrong shape for this: if a supplier MERGE or rename changed the name on
-- one row and not on its twin, the two rows carry different vendor_name text
-- and the grouping treats them as unrelated. Matched on the invoice and GRN
-- instead, which a rename cannot alter.

-- 1. Same GRN + same amount, more than one bill, WHATEVER the vendor name says.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS dup_by_grn_amount
FROM (
  SELECT 'grn=' || grn_no || ' amt=' || invoice_amount
         || ' rows=' || COUNT(*)
         || ' names=' || string_agg(DISTINCT vendor_name, ' / ')
         || ' paid=' || string_agg(COALESCE(paid_amount::text,'0'), '/')
         || ' st=' || string_agg(COALESCE(payment_status,'(null)'), '/') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(grn_no,''), NULL) IS NOT NULL AND invoice_amount IS NOT NULL
  GROUP BY grn_no, invoice_amount
  HAVING COUNT(*) > 1
) x;

-- 2. Same INVOICE + same amount, more than one bill, whatever the name.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS dup_by_invoice_amount
FROM (
  SELECT 'inv=' || invoice_no || ' amt=' || invoice_amount
         || ' rows=' || COUNT(*)
         || ' names=' || string_agg(DISTINCT vendor_name, ' / ')
         || ' grns=' || string_agg(DISTINCT COALESCE(NULLIF(grn_no,''),'(blank)'), '/')
         || ' paid=' || string_agg(COALESCE(paid_amount::text,'0'), '/')
         || ' st=' || string_agg(COALESCE(payment_status,'(null)'), '/') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(invoice_no,''), NULL) IS NOT NULL AND invoice_amount IS NOT NULL
  GROUP BY invoice_no, invoice_amount
  HAVING COUNT(*) > 1
) y;

-- 3. Do the four named vendors have rows whose party_id disagrees with the
--    vendor_name -- the fingerprint of a merge that moved one and not the other?
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS name_vs_party_mismatch
FROM (
  SELECT pp.vendor_name || ' -> party says ' || COALESCE(p.name,'(no party row)')
         || ' grn=' || COALESCE(NULLIF(pp.grn_no,''),'(blank)')
         || ' st=' || COALESCE(pp.payment_status,'(null)') AS line
  FROM public.pending_payments pp
  LEFT JOIN public.parties p ON p.id = pp.party_id
  WHERE (pp.vendor_name ILIKE '%Healers%' OR pp.vendor_name ILIKE '%Venco Research%'
      OR pp.vendor_name ILIKE '%More Than Solutions%' OR pp.vendor_name ILIKE '%We Care%')
    AND (p.name IS NULL OR p.name <> pp.vendor_name)
) z;
