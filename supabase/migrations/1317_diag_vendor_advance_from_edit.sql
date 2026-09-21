-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner changed an EXISTING bank transaction to a vendor advance and asks
-- whether the advance record was created and whether it reached the party
-- ledger. The tick added today is gated on a NEW transaction, and 'Vendor
-- Advance' was also added to the Category list - which IS selectable while
-- editing, and on its own only changes a label. Measure whether an advance
-- exists, and find any bank row calling itself a Vendor Advance with no
-- advance record behind it.

-- 1. Advances created today, if any
SELECT va.advance_date::text AS advance_date,
       COALESCE(p.name,'(no party)') AS party,
       round(va.amount)::int AS amount,
       va.payment_mode,
       COALESCE(va.reference_no,'-') AS ref_no,
       to_char(va.created_at AT TIME ZONE 'Asia/Kolkata','DD/MM/YY HH24:MI') AS created_ist,
       (SELECT count(*)::int FROM public.bank_transactions b WHERE b.vendor_advance_id = va.id) AS bank_rows
FROM public.vendor_advances va
LEFT JOIN public.parties p ON p.id = va.party_id
WHERE va.created_at >= (now() - interval '1 day')
ORDER BY va.created_at DESC;

-- 2. Bank rows that SAY Vendor Advance but carry no advance record. These are
--    the ones that look done and are not - the money shows in the bank but
--    nothing reaches the party ledger.
SELECT b.txn_date::text AS txn_date,
       COALESCE(p.name,'(no party)') AS party,
       b.txn_type,
       round(b.amount)::int AS amount,
       COALESCE(b.description,'-') AS description,
       CASE WHEN b.vendor_advance_id IS NULL THEN 'NO ADVANCE RECORD' ELSE 'linked' END AS state
FROM public.bank_transactions b
LEFT JOIN public.parties p ON p.id = b.party_id
WHERE b.category = 'Vendor Advance'
ORDER BY b.txn_date DESC;

-- 3. Totals, so the size of it is plain
SELECT (SELECT count(*)::int FROM public.vendor_advances) AS advances_total,
       (SELECT count(*)::int FROM public.bank_transactions WHERE vendor_advance_id IS NOT NULL) AS bank_rows_linked,
       (SELECT count(*)::int FROM public.bank_transactions WHERE category = 'Vendor Advance') AS bank_rows_labelled,
       (SELECT count(*)::int FROM public.bank_transactions
        WHERE category = 'Vendor Advance' AND vendor_advance_id IS NULL) AS labelled_but_orphan,
       (SELECT round(COALESCE(sum(amount),0))::int FROM public.bank_transactions
        WHERE category = 'Vendor Advance' AND vendor_advance_id IS NULL) AS orphan_amount;

-- 4. What the party ledger currently shows for any party touched by today's
--    advances - Advance Paid lines come from vendor_advances, never from
--    bank_transactions, so a bank row alone reaches nothing here.
SELECT p.name,
       count(*) FILTER (WHERE l.source_table = 'vendor_advance')::int AS advance_lines,
       round(COALESCE(sum(l.debit) FILTER (WHERE l.source_table = 'vendor_advance'),0))::int AS advance_debit,
       count(*)::int AS all_lines,
       round(sum(l.debit) - sum(l.credit))::int AS closing
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.id IN (
  SELECT party_id FROM public.vendor_advances WHERE created_at >= (now() - interval '1 day')
  UNION
  SELECT party_id FROM public.bank_transactions WHERE category = 'Vendor Advance' AND party_id IS NOT NULL
)
GROUP BY p.name ORDER BY p.name;
