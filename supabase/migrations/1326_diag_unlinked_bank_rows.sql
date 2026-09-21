-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- 109 of 518 bank rows carry no link of any kind - no bill, no invoice, no
-- vendor advance. Some of those are RIGHT to be unlinked: bank charges,
-- interest, a cash withdrawal, a transfer between our own accounts, a salary
-- batch. Others are money that belongs against somebody's account and never
-- got there. Separate the two rather than treat 109 as a problem or as fine.

-- 1. The shape of them, by direction
SELECT txn_type,
       count(*)::int AS rows,
       round(sum(amount))::int AS amount,
       count(*) FILTER (WHERE party_id IS NOT NULL)::int AS with_party,
       count(*) FILTER (WHERE party_id IS NULL)::int AS no_party
FROM public.bank_transactions
WHERE nhe_sale_id IS NULL AND he_dispatch_id IS NULL
  AND linked_payment_id IS NULL AND vendor_advance_id IS NULL
GROUP BY txn_type ORDER BY txn_type;

-- 2. By category, compactly - which heads they sit under
SELECT COALESCE(string_agg(t.cat || ' n' || t.n || ' ' || t.lakh || 'L' ||
                CASE WHEN t.wp > 0 THEN ' (' || t.wp || ' w/party)' ELSE '' END,
                ' | ' ORDER BY t.n DESC), 'none') AS by_category
FROM (
  SELECT COALESCE(NULLIF(category,''), '(no category)') AS cat,
         count(*)::int AS n,
         round(sum(amount)/100000.0, 1) AS lakh,
         count(*) FILTER (WHERE party_id IS NOT NULL)::int AS wp
  FROM public.bank_transactions
  WHERE nhe_sale_id IS NULL AND he_dispatch_id IS NULL
    AND linked_payment_id IS NULL AND vendor_advance_id IS NULL
  GROUP BY 1
) t;

-- 3. The ones that look like they SHOULD be against somebody: a party is set.
--    Split by direction, because a Credit with a party is an unallocated
--    receipt and a Debit with a party is an unallocated payment - different
--    problems.
SELECT COALESCE(string_agg(t.nm || ' ' || t.tt || ' n' || t.n || ' ' || t.lakh || 'L',
                ' | ' ORDER BY t.n DESC), 'none') AS unlinked_with_party
FROM (
  SELECT left(COALESCE(p.name,'(none)'), 22) AS nm, b.txn_type AS tt,
         count(*)::int AS n, round(sum(b.amount)/100000.0, 1) AS lakh
  FROM public.bank_transactions b
  LEFT JOIN public.parties p ON p.id = b.party_id
  WHERE b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL
    AND b.linked_payment_id IS NULL AND b.vendor_advance_id IS NULL
    AND b.party_id IS NOT NULL
  GROUP BY 1,2
) t;

-- 4. Of the unlinked rows with a party, does that party actually have anything
--    open to link against? No open bill or invoice means the row is unlinked
--    because there is nothing to link it TO, not because someone forgot.
SELECT count(*)::int AS unlinked_with_party,
       count(*) FILTER (WHERE b.txn_type = 'Credit'
         AND EXISTS (SELECT 1 FROM public.he_dispatch d WHERE d.party_id = b.party_id
                       AND COALESCE(d.payment_status,'Pending') <> 'Received'))::int AS credit_party_has_open_he,
       count(*) FILTER (WHERE b.txn_type = 'Credit'
         AND EXISTS (SELECT 1 FROM public.nhe_sales n WHERE n.party_id = b.party_id
                       AND COALESCE(n.payment_status,'Pending') <> 'Received'))::int AS credit_party_has_open_nhe,
       count(*) FILTER (WHERE b.txn_type = 'Debit'
         AND EXISTS (SELECT 1 FROM public.pending_payments pp WHERE pp.party_id = b.party_id
                       AND COALESCE(pp.payment_status,'Pending') <> 'Paid'))::int AS debit_party_has_open_bill
FROM public.bank_transactions b
WHERE b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL
  AND b.linked_payment_id IS NULL AND b.vendor_advance_id IS NULL
  AND b.party_id IS NOT NULL;

-- 5. And the plainly-standalone ones, so they are not counted as a problem
SELECT count(*)::int AS no_party_rows,
       round(sum(amount))::int AS amount,
       COALESCE(string_agg(DISTINCT COALESCE(NULLIF(category,''),'(no category)'), ', '), 'none') AS categories
FROM public.bank_transactions
WHERE nhe_sale_id IS NULL AND he_dispatch_id IS NULL
  AND linked_payment_id IS NULL AND vendor_advance_id IS NULL
  AND party_id IS NULL;
