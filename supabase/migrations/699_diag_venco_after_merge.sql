-- Diagnostic only. 698 ran with Errors: 0 but printed only its "before" line,
-- and on this runner an unprinted statement can mean a swallowed failure. The
-- result is read back on its own.
SELECT COALESCE(string_agg('grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
       || ' paid=' || COALESCE(paid_amount::text,'0')
       || ' adv=' || COALESCE(advance_adjusted::text,'0')
       || ' st=' || COALESCE(payment_status,'(null)'), ' | ' ORDER BY grn_no), 'NO ROWS') AS venco_39975_now
FROM public.pending_payments WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975;

SELECT (SELECT COUNT(*)::text FROM public.pending_payments
        WHERE vendor_name ILIKE '%venco%' AND COALESCE(payment_status,'Pending') <> 'Paid') AS venco_still_open,
       (SELECT COUNT(*)::text FROM public.cash_book cb
        WHERE cb.pending_payment_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.pending_payments p WHERE p.id = cb.pending_payment_id)) AS orphan_cash_links,
       (SELECT COUNT(*)::text FROM public.bank_transactions bt
        WHERE bt.linked_payment_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.pending_payments p WHERE p.id = bt.linked_payment_id)) AS orphan_bank_links;
