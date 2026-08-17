-- Remove the phantom Pending bills created when a supplier merge/rename left
-- the bill's own vendor_name in a different LETTER CASE from the party record.
--
-- "HEALERS ASSOCIATES" and "Healers Associates" are the same supplier, but the
-- app matches bills to GRNs on (vendor_name, grn_no) as plain text, so the two
-- spellings behave as two vendors: one bill gets paid, the other sits Pending
-- for ever. Confirmed pairs, each with the SAME invoice, GRN and amount:
--   589/26-27  GRN 2743  1,17,000  More Than Solutions Pvt Ltd / MORE THAN...
--   HAP/26-27/48 GRN 2446 1,75,000 Healers Associates / HEALERS ASSOCIATES
--   WAH0712627 GRN 2810    72,000  We Care Animal Health / WE CARE ANIMAL...
--
-- Deletion rule, deliberately strict: a row is removed only when it has
-- received NOTHING (no paid amount, no advance adjusted, not marked Paid) AND
-- another row for the same invoice and amount HAS been paid. A row holding any
-- money is never touched, whatever its name looks like.

-- BEFORE: every pair, with ids, so the record shows exactly what was acted on.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS pairs_before
FROM (
  SELECT UPPER(invoice_no) || ' amt=' || invoice_amount
         || ' rows=' || COUNT(*)
         || ' names=' || string_agg(DISTINCT vendor_name, ' / ')
         || ' paid=' || string_agg(COALESCE(paid_amount::text,'0'), '/')
         || ' st=' || string_agg(COALESCE(payment_status,'(null)'), '/') AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(invoice_no,''), NULL) IS NOT NULL AND invoice_amount IS NOT NULL
  GROUP BY UPPER(invoice_no), invoice_amount
  HAVING COUNT(*) > 1 AND COUNT(DISTINCT UPPER(vendor_name)) = 1
) x;

-- Venco specifically, since its pair was not visible in the truncated output.
SELECT COALESCE(string_agg('grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
       || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
       || ' amt=' || COALESCE(invoice_amount::text,'-')
       || ' paid=' || COALESCE(paid_amount::text,'0')
       || ' adv=' || COALESCE(advance_adjusted::text,'0')
       || ' st=' || COALESCE(payment_status,'(null)'), ' | ' ORDER BY grn_no), 'NONE') AS venco_rows
FROM public.pending_payments WHERE vendor_name ILIKE '%venco%';

-- THE DELETE. Same invoice + same amount + same vendor ignoring case, this row
-- has nothing against it, the other has money against it.
DELETE FROM public.pending_payments p
WHERE COALESCE(p.paid_amount,0) = 0
  AND COALESCE(p.advance_adjusted,0) = 0
  AND COALESCE(p.payment_status,'Pending') <> 'Paid'
  AND COALESCE(NULLIF(p.invoice_no,''), NULL) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.pending_payments q
    WHERE q.id <> p.id
      AND UPPER(q.vendor_name) = UPPER(p.vendor_name)
      AND UPPER(q.invoice_no) = UPPER(p.invoice_no)
      AND q.invoice_amount = p.invoice_amount
      AND (COALESCE(q.paid_amount,0) > 0 OR COALESCE(q.advance_adjusted,0) > 0
           OR q.payment_status = 'Paid')
  );

-- Normalise the surviving bills' vendor_name to the party record's spelling, so
-- ledger and statements stop splitting one supplier into two.
UPDATE public.pending_payments pp
SET vendor_name = pt.name
FROM public.parties pt
WHERE pp.party_id = pt.id AND pp.vendor_name <> pt.name;

-- AFTER: nothing should remain that matches the pair shape.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE LEFT') AS pairs_after
FROM (
  SELECT UPPER(invoice_no) || ' amt=' || invoice_amount || ' rows=' || COUNT(*) AS line
  FROM public.pending_payments
  WHERE COALESCE(NULLIF(invoice_no,''), NULL) IS NOT NULL AND invoice_amount IS NOT NULL
  GROUP BY UPPER(invoice_no), invoice_amount
  HAVING COUNT(*) > 1 AND COUNT(DISTINCT UPPER(vendor_name)) = 1
) y;

-- And the payables total that came off, plus any name still disagreeing with
-- its party.
SELECT (SELECT COUNT(*)::text FROM public.pending_payments
        WHERE COALESCE(payment_status,'Pending') NOT IN ('Paid')) AS open_bills_now,
       (SELECT COUNT(*)::text FROM public.pending_payments pp
        JOIN public.parties pt ON pt.id = pp.party_id
        WHERE pp.vendor_name <> pt.name) AS names_still_disagreeing;
