-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner reports the link I wrote is WRONG: receipt Rs 11,69,905 described
-- "HE Egg Sale - F-20 - 4639" actually belongs to DC 4594 (F-19), whose
-- amount less TDS is 11,71,076 - 1,171 = 11,69,905 exactly. DC 4639 is
-- 13,66,246 - 1,366 = 13,64,880, which is not the receipt.
--
-- My guard in 1325 checked d.amount_received = bank amount. That passed
-- because 11,69,905 had ALREADY been mis-recorded against 4639 before I
-- touched anything - so I verified consistency with data that was itself
-- wrong. The DESCRIPTION is not a reliable key; the amount net of TDS is.
--
-- Re-check all 7 the right way before changing anything further.

-- 1. Each of the 7: what it was linked to, versus which dispatch its amount
--    actually matches net of TDS.
WITH b7 AS (
  SELECT bk.id, bk.amount, bk.txn_date,
         (regexp_match(bk.description, '([0-9]+)\s*$'))[1] AS said_dc
  FROM public.bank_transactions_backup_1325 bk
)
SELECT COALESCE(string_agg(
  b.said_dc || ' Rs' || round(b.amount)::int ||
  ' -> linked ' || COALESCE(ld.dc_no::text, '-') ||
  ' net' || COALESCE(round(ld.amount - COALESCE(ld.tds_amount,0))::int::text, '-') ||
  ' || amount matches DC ' || COALESCE((
    SELECT string_agg(d2.dc_no::text, ',' ORDER BY d2.dc_no)
    FROM public.he_dispatch d2
    WHERE round(d2.amount - COALESCE(d2.tds_amount,0)) = round(b.amount)), 'NONE'),
  ' // ' ORDER BY b.txn_date), 'none') AS described_vs_actual
FROM b7 b
LEFT JOIN public.bank_transactions cur ON cur.id = b.id
LEFT JOIN public.he_dispatch ld ON ld.id = cur.he_dispatch_id;

-- 2. How many of the 7 are linked to a dispatch whose net does NOT equal the
--    receipt. That is the count of wrong links.
WITH b7 AS (
  SELECT bk.id, bk.amount FROM public.bank_transactions_backup_1325 bk
)
SELECT count(*)::int AS total,
       count(*) FILTER (WHERE round(ld.amount - COALESCE(ld.tds_amount,0)) = round(b.amount))::int AS net_matches_linked,
       count(*) FILTER (WHERE round(ld.amount - COALESCE(ld.tds_amount,0)) <> round(b.amount))::int AS wrong_link,
       count(*) FILTER (WHERE ld.id IS NULL)::int AS not_linked
FROM b7 b
LEFT JOIN public.bank_transactions cur ON cur.id = b.id
LEFT JOIN public.he_dispatch ld ON ld.id = cur.he_dispatch_id;

-- 3. The dispatches whose net DOES match each receipt - what state are they
--    in? If they read Pending, that is the real unpaid invoice.
WITH b7 AS (SELECT bk.amount FROM public.bank_transactions_backup_1325 bk)
SELECT COALESCE(string_agg(
  d.dc_no::text || '/' || COALESCE(d.invoice_no,'-') ||
  ' amt' || round(d.amount)::int ||
  ' recd' || round(COALESCE(d.amount_received,0))::int ||
  ' ' || COALESCE(d.payment_status,'(never set)'),
  ' | ' ORDER BY d.dc_no), 'none') AS true_owner_state
FROM b7 b
JOIN public.he_dispatch d
  ON round(d.amount - COALESCE(d.tds_amount,0)) = round(b.amount);

-- 4. And the state of the dispatches I linked them to
WITH b7 AS (SELECT bk.id FROM public.bank_transactions_backup_1325 bk)
SELECT COALESCE(string_agg(
  ld.dc_no::text || '/' || COALESCE(ld.invoice_no,'-') ||
  ' amt' || round(ld.amount)::int ||
  ' recd' || round(COALESCE(ld.amount_received,0))::int ||
  ' ' || COALESCE(ld.payment_status,'(never set)'),
  ' | ' ORDER BY ld.dc_no), 'none') AS linked_state
FROM b7 b
JOIN public.bank_transactions cur ON cur.id = b.id
JOIN public.he_dispatch ld ON ld.id = cur.he_dispatch_id;
