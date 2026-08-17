-- Diagnostic only. Venco still shows a Pending bill. The earlier listing was
-- cut off at GRN 2071, so anything above that was never seen -- the screenshot
-- showed GRN 2086, Chicks, 39,975. Asking only for what is still OPEN.
SELECT COALESCE(string_agg('id=' || id::text
       || ' grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
       || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
       || ' amt=' || COALESCE(invoice_amount::text,'-')
       || ' paid=' || COALESCE(paid_amount::text,'0')
       || ' adv=' || COALESCE(advance_adjusted::text,'0')
       || ' st=' || COALESCE(payment_status,'(null)'), ' | ' ORDER BY grn_no), 'NONE OPEN') AS venco_open_rows
FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%'
  AND COALESCE(payment_status,'Pending') <> 'Paid';

-- Every Venco row at that amount, paid or not, to see the twin.
SELECT COALESCE(string_agg('grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
       || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
       || ' date=' || COALESCE(to_char(grn_date,'DD/MM/YY'),'-')
       || ' paid=' || COALESCE(paid_amount::text,'0')
       || ' adv=' || COALESCE(advance_adjusted::text,'0')
       || ' st=' || COALESCE(payment_status,'(null)'), ' | ' ORDER BY grn_no), 'NONE') AS venco_39975_rows
FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975;

-- Is there a GRN 2086 behind it, and what does it say?
SELECT COALESCE(string_agg('grn=' || COALESCE(grn_no,'-')
       || ' inv=' || COALESCE(invoice_no,'(blank)')
       || ' amt=' || COALESCE(COALESCE(total_amount, basic_amount)::text,'-')
       || ' item=' || COALESCE(item_name,'-')
       || ' date=' || COALESCE(to_char(grn_date,'DD/MM/YY'),'-'), ' | '), 'NO GRN 2086') AS grn_2086
FROM public.grn WHERE grn_no IN ('2086','0000');
