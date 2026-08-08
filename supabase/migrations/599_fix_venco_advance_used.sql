-- Mark the 29/06/2026 Venco advance as fully consumed.
--
-- Measured state (598):
--   advance  amount 29,22,000  tds 7,922  used 29,14,078  -> 7,922 still shown available
--   bill VMINV/498  net 13,97,500  paid 13,89,578  advadj 300
--
-- The 7,922 is the TDS withheld from that advance: Venco was credited the full
-- gross but received 29,14,078 in cash, and the 7,922 goes to the government.
-- It is not money still available to spend against future bills, so leaving it
-- as "available" would overstate the advance balance permanently.
--
-- The UI cannot fix this: amount_used is maintained only by the Pay modal, and
-- that button is hidden once a bill is Paid.
--
-- Targeted by id-equivalent conditions (party + date + exact amount + tds), not
-- by date alone, so no other advance can be touched. Idempotent: the WHERE
-- clause stops matching once the value is corrected.

UPDATE public.vendor_advances va
SET amount_used = va.amount
FROM public.parties p
WHERE p.id = va.party_id
  AND p.name ILIKE '%venco%'
  AND va.advance_date = '2026-06-29'
  AND va.amount = 2922000
  AND va.tds_amount = 7922
  AND va.amount_used = 2914078;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT COALESCE(string_agg(
         va.advance_date::text || ' amt=' || va.amount || ' tds=' || COALESCE(va.tds_amount,0) ||
         ' used=' || va.amount_used || ' AVAILABLE=' || (va.amount - va.amount_used),
         ' | ' ORDER BY va.advance_date), 'NONE') AS venco_advance_after
FROM public.vendor_advances va
JOIN public.parties p ON p.id = va.party_id
WHERE p.name ILIKE '%venco%' AND COALESCE(va.tds_amount,0) > 0;

-- Nothing else should have moved: every Venco advance, for comparison.
SELECT COALESCE(string_agg(
         va.advance_date::text || ' amt=' || va.amount || ' used=' || va.amount_used,
         ' | ' ORDER BY va.advance_date, va.amount), 'NONE') AS all_venco_advances
FROM public.vendor_advances va
JOIN public.parties p ON p.id = va.party_id
WHERE p.name ILIKE '%venco%';

-- The bill is NOT changed here - reported so its state is visible.
SELECT COALESCE(string_agg(
         'inv=' || COALESCE(invoice_no,'-') || ' net=' || COALESCE(invoice_amount,0) ||
         ' tds=' || COALESCE(tds_amount,0) || ' paid=' || COALESCE(paid_amount,0) ||
         ' advadj=' || COALESCE(advance_adjusted,0) || ' status=' || COALESCE(payment_status,'-'), ' | '), 'NONE') AS bill_498_unchanged
FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%' AND invoice_no ILIKE '%498%';
