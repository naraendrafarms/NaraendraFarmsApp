-- Diagnostic only (no schema changes).
--
-- An advance paid 29/06/2026 carried TDS; the bill it was adjusted against was
-- settled 06/08/2026. The TDS should be reported in JUNE (due on payment or
-- credit, whichever is earlier - here the payment), but it is appearing in
-- August. Find out WHERE the TDS is actually recorded, because that decides
-- which date the report uses:
--   on vendor_advances -> dated by advance_date        (June)
--   on pending_payments -> dated by grn_date/invoice_date (whatever the bill says)

-- 1. Advances around that date, and whether any carries TDS.
SELECT COALESCE(string_agg(
         va.advance_date::text || ' [' || COALESCE(p.name,'?') || '] amt=' || va.amount ||
         ' tds=' || COALESCE(va.tds_amount,0) || ' sec=' || COALESCE(va.tds_section,'-') ||
         ' used=' || va.amount_used, ' | ' ORDER BY va.advance_date), 'NONE') AS advances_jun_aug
FROM public.vendor_advances va
LEFT JOIN public.parties p ON p.id = va.party_id
WHERE va.advance_date BETWEEN '2026-06-01' AND '2026-08-31';

-- 2. Bills that consumed an advance — their dates and their TDS.
SELECT COALESCE(string_agg(
         'inv=' || COALESCE(pp.invoice_no,'-') ||
         ' grn_date=' || COALESCE(pp.grn_date::text,'-') ||
         ' inv_date=' || COALESCE(pp.invoice_date::text,'-') ||
         ' paid=' || COALESCE(pp.paid_date::text,'-') ||
         ' tds=' || COALESCE(pp.tds_amount,0) ||
         ' adv_adj=' || COALESCE(pp.advance_adjusted,0) ||
         ' [' || COALESCE(pp.vendor_name,'?') || ']', ' | ' ORDER BY pp.paid_date), 'NONE') AS bills_using_advance
FROM public.pending_payments pp
WHERE pp.vendor_advance_id IS NOT NULL OR COALESCE(pp.advance_adjusted,0) > 0;

-- 3. All TDS-bearing bills dated in August, to see what the report is picking up.
SELECT COALESCE(string_agg(
         COALESCE(grn_date::text, invoice_date::text, '?') || ' [' || COALESCE(vendor_name,'?') ||
         '] tds=' || tds_amount, ' | '), 'NONE') AS aug_tds_bills
FROM public.pending_payments
WHERE COALESCE(tds_amount,0) > 0
  AND COALESCE(grn_date, invoice_date) BETWEEN '2026-08-01' AND '2026-08-31';

-- 4. And in June, for comparison.
SELECT COALESCE(string_agg(
         COALESCE(grn_date::text, invoice_date::text, '?') || ' [' || COALESCE(vendor_name,'?') ||
         '] tds=' || tds_amount, ' | '), 'NONE') AS jun_tds_bills
FROM public.pending_payments
WHERE COALESCE(tds_amount,0) > 0
  AND COALESCE(grn_date, invoice_date) BETWEEN '2026-06-01' AND '2026-06-30';
