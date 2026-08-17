-- Diagnostic only. Just the rows for the two vendors reported, one statement so
-- the output is not truncated.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS more_than_solutions
FROM (
  SELECT 'grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
         || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
         || ' amt=' || COALESCE(invoice_amount::text,'-')
         || ' paid=' || COALESCE(paid_amount::text,'0')
         || ' adv=' || COALESCE(advance_adjusted::text,'0')
         || ' status=' || COALESCE(payment_status,'(null)')
         || ' created=' || to_char(created_at,'DD/MM/YY HH24:MI') AS line
  FROM public.pending_payments WHERE vendor_name ILIKE '%More Than Solutions%'
) x;

SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS venco_research
FROM (
  SELECT 'grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
         || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
         || ' amt=' || COALESCE(invoice_amount::text,'-')
         || ' paid=' || COALESCE(paid_amount::text,'0')
         || ' adv=' || COALESCE(advance_adjusted::text,'0')
         || ' status=' || COALESCE(payment_status,'(null)') AS line
  FROM public.pending_payments WHERE vendor_name ILIKE '%Venco Research%'
) y;

-- The three rows with no GRN number at all, whoever they belong to.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS rows_without_grn
FROM (
  SELECT vendor_name || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
         || ' amt=' || COALESCE(invoice_amount::text,'-')
         || ' status=' || COALESCE(payment_status,'(null)') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(grn_no,''), NULL) IS NULL
    AND COALESCE(payment_status,'Pending') <> 'Paid'
) z;

-- Is the ₹1,17,000 bank payment linked to a pending_payments row at all?
SELECT COALESCE(string_agg('linked_payment_id=' || COALESCE(linked_payment_id::text,'NULL'), ', '), 'NO SUCH TXN') AS the_117000_payment
FROM public.bank_transactions WHERE reference_no = 'CMS1802612036320';
