-- Diagnostic only (no schema changes).
-- The 29/06 Venco advance was edited to carry the TDS. Verify four things:
--   1. the advance now holds gross 29,22,000 with TDS 7,922
--   2. its BANK entry still exists and is still 29,14,078 (the edit path
--      deletes and re-inserts it, so confirm nothing was lost)
--   3. whether the 7,922 is still ALSO on bill VMINV/498 (would double-count)
--   4. which month the TDS now reports in

SELECT COALESCE(string_agg(
         va.advance_date::text || ' [' || COALESCE(p.name,'?') || '] amt=' || va.amount ||
         ' tds=' || COALESCE(va.tds_amount,0) || ' pct=' || COALESCE(va.tds_pct,0) ||
         ' sec=' || COALESCE(va.tds_section,'-') || ' used=' || va.amount_used ||
         ' dep=' || CASE WHEN va.tds_deposited THEN 'Y' ELSE 'N' END,
         ' | ' ORDER BY va.advance_date, va.amount), 'NONE') AS venco_advances
FROM public.vendor_advances va
LEFT JOIN public.parties p ON p.id = va.party_id
WHERE p.name ILIKE '%venco%';

-- Bank entries attached to those advances — amount must still be the NET.
SELECT COALESCE(string_agg(
         bt.txn_date::text || ' ' || bt.txn_type || ' amt=' || bt.amount ||
         ' acct=' || COALESCE(ba.account_name, ba.bank_name, '?'),
         ' | ' ORDER BY bt.txn_date), 'NO BANK ENTRIES') AS advance_bank_entries
FROM public.bank_transactions bt
JOIN public.vendor_advances va ON va.id = bt.vendor_advance_id
LEFT JOIN public.parties p ON p.id = va.party_id
LEFT JOIN public.bank_accounts ba ON ba.id = bt.bank_account_id
WHERE p.name ILIKE '%venco%';

-- Is the 7,922 still on the August bill as well?
SELECT COALESCE(string_agg(
         'inv=' || COALESCE(invoice_no,'-') || ' date=' || COALESCE(grn_date::text, invoice_date::text,'-') ||
         ' amt=' || COALESCE(invoice_amount,0) || ' tds=' || COALESCE(tds_amount,0) ||
         ' paid=' || COALESCE(paid_amount,0) || ' advadj=' || COALESCE(advance_adjusted,0) ||
         ' status=' || COALESCE(payment_status,'-'), ' | '), 'NONE') AS venco_bill_498
FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%' AND invoice_no ILIKE '%498%';

-- Month-wise TDS totals the report will now show, from BOTH sources.
SELECT 'advances' AS src, to_char(advance_date,'YYYY-MM') AS m, SUM(tds_amount) AS tds
FROM public.vendor_advances WHERE COALESCE(tds_amount,0) > 0
GROUP BY 2
UNION ALL
SELECT 'bills', to_char(COALESCE(grn_date, invoice_date),'YYYY-MM'), SUM(tds_amount)
FROM public.pending_payments
WHERE COALESCE(tds_amount,0) > 0
  AND COALESCE(grn_date, invoice_date) BETWEEN '2026-06-01' AND '2026-08-31'
GROUP BY 2
ORDER BY 1, 2;
