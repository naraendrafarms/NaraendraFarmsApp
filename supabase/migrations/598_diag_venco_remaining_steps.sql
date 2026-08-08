-- Diagnostic only (no schema changes).
-- The advance TDS section was changed. Check what is still outstanding on the
-- Venco correction: is the 7,922 still duplicated on bill VMINV/498, and does
-- the advance still have 7,922 unused waiting to be adjusted against it.

SELECT COALESCE(string_agg(
         va.advance_date::text || ' amt=' || va.amount || ' tds=' || COALESCE(va.tds_amount,0) ||
         ' sec=' || COALESCE(va.tds_section,'-') || ' used=' || va.amount_used ||
         ' AVAILABLE=' || (va.amount - va.amount_used) ||
         ' dep=' || CASE WHEN va.tds_deposited THEN 'Y' ELSE 'N' END,
         ' | ' ORDER BY va.advance_date), 'NONE') AS venco_advance_with_tds
FROM public.vendor_advances va
JOIN public.parties p ON p.id = va.party_id
WHERE p.name ILIKE '%venco%' AND COALESCE(va.tds_amount,0) > 0;

SELECT COALESCE(string_agg(
         'inv=' || COALESCE(invoice_no,'-') || ' net=' || COALESCE(invoice_amount,0) ||
         ' tds=' || COALESCE(tds_amount,0) || ' paid=' || COALESCE(paid_amount,0) ||
         ' disc=' || COALESCE(discount_amount,0) || ' advadj=' || COALESCE(advance_adjusted,0) ||
         ' BALANCE=' || (COALESCE(invoice_amount,0) - COALESCE(tds_amount,0)
                         - COALESCE(paid_amount,0) - COALESCE(discount_amount,0)) ||
         ' status=' || COALESCE(payment_status,'-'), ' | '), 'NONE') AS bill_498
FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%' AND invoice_no ILIKE '%498%';

-- Month totals the TDS report will show right now, both sources.
SELECT 'advances' AS src, to_char(advance_date,'YYYY-MM') AS m, SUM(tds_amount) AS tds
FROM public.vendor_advances WHERE COALESCE(tds_amount,0) > 0 GROUP BY 2
UNION ALL
SELECT 'bills', to_char(COALESCE(grn_date, invoice_date),'YYYY-MM'), SUM(tds_amount)
FROM public.pending_payments
WHERE COALESCE(tds_amount,0) > 0
  AND COALESCE(grn_date, invoice_date) BETWEEN '2026-06-01' AND '2026-08-31'
GROUP BY 2 ORDER BY 1, 2;

-- Did any phantom Cash Book entry get created against this bill?
SELECT COALESCE(string_agg(cb.txn_date::text || ' out=' || cb.amount_out || ' ' || COALESCE(cb.description,''), ' | '), 'NONE') AS cashbook_for_498
FROM public.cash_book cb
JOIN public.pending_payments pp ON pp.id = cb.pending_payment_id
WHERE pp.invoice_no ILIKE '%498%';
