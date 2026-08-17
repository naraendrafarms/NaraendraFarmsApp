-- Diagnostic only. Find EVERY duplicate bill pair, not just the one reported.
--
-- My earlier check grouped on (vendor, invoice_no) and reported "no duplicates"
-- while two rows for GRN 2743 were sitting there -- because both carried the
-- same invoice number and the grouping counted them as one. Written properly
-- this time: group on vendor + GRN, and separately on vendor + invoice +
-- amount, so a duplicate is caught whichever field was edited.
--
-- Read-only. Nothing is deleted.

-- 1. Same vendor + same GRN number, more than one bill row.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS dup_by_vendor_and_grn
FROM (
  SELECT vendor_name || ' grn=' || grn_no
         || ' rows=' || COUNT(*)
         || ' amt=' || string_agg(DISTINCT COALESCE(invoice_amount::text,'-'), '/')
         || ' paid=' || string_agg(COALESCE(paid_amount::text,'0'), '/')
         || ' st=' || string_agg(COALESCE(payment_status,'(null)'), '/') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(grn_no,''), NULL) IS NOT NULL
  GROUP BY vendor_name, grn_no
  HAVING COUNT(*) > 1
) x;

-- 2. Same vendor + same invoice + same amount, different GRN numbers -- the
--    shape produced when the GRN NUMBER itself was changed.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS dup_by_vendor_invoice_amount
FROM (
  SELECT vendor_name || ' inv=' || invoice_no
         || ' amt=' || invoice_amount
         || ' rows=' || COUNT(*)
         || ' grns=' || string_agg(COALESCE(NULLIF(grn_no,''),'(blank)'), '/')
         || ' paid=' || string_agg(COALESCE(paid_amount::text,'0'), '/')
         || ' st=' || string_agg(COALESCE(payment_status,'(null)'), '/') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(invoice_no,''), NULL) IS NOT NULL AND invoice_amount IS NOT NULL
  GROUP BY vendor_name, invoice_no, invoice_amount
  HAVING COUNT(DISTINCT COALESCE(grn_no,'')) > 1
) y;

-- 3. How much money the phantom rows are inflating the payables by: unpaid rows
--    that have a PAID twin on the same vendor + GRN.
SELECT COUNT(*)::text AS phantom_rows,
       COALESCE(SUM(p.invoice_amount)::text,'0') AS inflating_payables_by
FROM public.pending_payments p
WHERE COALESCE(p.paid_amount,0) = 0
  AND COALESCE(p.payment_status,'Pending') <> 'Paid'
  AND COALESCE(NULLIF(p.grn_no,''), NULL) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.pending_payments q
    WHERE q.id <> p.id AND q.vendor_name = p.vendor_name AND q.grn_no = p.grn_no
      AND COALESCE(q.paid_amount,0) > 0
  );

-- 4. Does pending_payments already carry a grn_id? The permanent fix ties the
--    bill to the GRN's id instead of its editable number, so this decides
--    whether a column has to be added.
SELECT COALESCE(string_agg(column_name, ', '), 'NO grn_id COLUMN') AS grn_link_columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='pending_payments' AND column_name LIKE '%grn%';
