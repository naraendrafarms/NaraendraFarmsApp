-- Diagnostic only (no schema changes).
-- 595's first statement printed nothing, so it could not be confirmed whether
-- a 29/06/2026 Venco advance exists at all. List every vendor advance, with no
-- date filter, so the answer is unambiguous.

SELECT COUNT(*) AS advances_total,
       COUNT(*) FILTER (WHERE COALESCE(tds_amount,0) > 0) AS with_tds,
       MIN(advance_date)::text AS first_date,
       MAX(advance_date)::text AS last_date
FROM public.vendor_advances;

SELECT COALESCE(string_agg(
         va.advance_date::text || ' [' || COALESCE(p.name,'?') || '] amt=' || va.amount ||
         ' used=' || va.amount_used || ' tds=' || COALESCE(va.tds_amount,0),
         ' | ' ORDER BY va.advance_date), 'NO ADVANCES') AS all_advances
FROM public.vendor_advances va
LEFT JOIN public.parties p ON p.id = va.party_id;

-- The Venco bill carrying the 7,922, in full.
SELECT COALESCE(string_agg(
         'inv=' || COALESCE(invoice_no,'-') || ' grn=' || COALESCE(grn_no,'-') ||
         ' grn_date=' || COALESCE(grn_date::text,'-') ||
         ' inv_date=' || COALESCE(invoice_date::text,'-') ||
         ' amt=' || COALESCE(invoice_amount,0) || ' tds=' || COALESCE(tds_amount,0) ||
         ' paid=' || COALESCE(paid_amount,0) || ' status=' || COALESCE(payment_status,'-'),
         ' | '), 'NONE') AS venco_tds_bill
FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%' AND COALESCE(tds_amount,0) > 0;
