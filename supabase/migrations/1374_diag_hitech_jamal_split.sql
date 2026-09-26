-- READ ONLY. Sharpening 1373, which was deliberately broad and so over-counted.
--
-- 1373 found FOUR parties matching, not the two the owner named:
--   Hitech Hatch Fresh Private Limited
--   Hitech Hatch Fresh Private Limited Advance   <- a second, near-duplicate
--   Jamal Agro Industries Private Limited
--   Venkateswara B. V. Biocorp Pvt Ltd - Hitech Div  <- a different company
-- so its 224 invoices and Rs 41.33 cr are NOT all these two buyers.
--
-- It also found unlinkedBank=0 and unlinkedCash=0, while linkedBank=59 totals
-- exactly the received figure. So there is NO pool of unlinked money waiting to
-- be attached - which means the gap is receipts never ENTERED, not receipts
-- entered against the wrong voucher. This splits it properly to prove that.

SELECT COALESCE(string_agg(x.line, ' ~ ' ORDER BY x.line), 'none') AS by_party_flock
  FROM ( SELECT left(p.name, 22) || '|F' || f.flock_no
                || '|n=' || COUNT(*)
                || '|due=' || ROUND(SUM(d.amount - COALESCE(d.amount_received,0))/100000.0, 2) || 'L' AS line
           FROM public.he_dispatch d
           JOIN public.parties p ON p.id = d.party_id
           JOIN public.flocks  f ON f.id = d.flock_id
          WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%')
            AND f.flock_no IN ('19','20') AND COALESCE(d.amount,0) > 0
          GROUP BY 1 ) x;

-- Does the near-duplicate "... Advance" party hold the money instead?
SELECT COALESCE(string_agg(left(p.name, 26) || '=' || ROUND(COALESCE(a.bal,0)/100000.0, 2) || 'L', ' ~ ' ORDER BY p.name), 'none')
    AS advance_balances
  FROM public.parties p
  LEFT JOIN ( SELECT party_id, SUM(amount - amount_used) AS bal
                FROM public.party_advances GROUP BY party_id ) a ON a.party_id = p.id
 WHERE p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%';

-- Bank credits per party, linked and unlinked, so no money is overlooked.
SELECT COALESCE(string_agg(x.line, ' ~ ' ORDER BY x.line), 'none') AS bank_by_party
  FROM ( SELECT left(p.name, 22)
                || '|n=' || COUNT(*)
                || '|tot=' || ROUND(SUM(b.amount)/100000.0, 2) || 'L'
                || '|unlinked=' || COUNT(*) FILTER (WHERE b.he_dispatch_id IS NULL AND b.nhe_sale_id IS NULL) AS line
           FROM public.bank_transactions b
           JOIN public.parties p ON p.id = b.party_id
          WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%') AND b.txn_type = 'Credit'
          GROUP BY 1 ) x;

-- Are the unpaid invoices old or recent? Tells us whether this is a backlog of
-- unentered receipts or genuinely outstanding money.
SELECT 'unpaid=' || COUNT(*)
    || ' oldest=' || COALESCE(MIN(d.dispatch_date)::text,'-')
    || ' newest=' || COALESCE(MAX(d.dispatch_date)::text,'-')
    || ' due=' || ROUND(SUM(d.amount - COALESCE(d.amount_received,0))/10000000.0, 2) || 'Cr'
    AS unpaid_age
  FROM public.he_dispatch d
  JOIN public.parties p ON p.id = d.party_id
  JOIN public.flocks  f ON f.id = d.flock_id
 WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%')
   AND f.flock_no IN ('19','20') AND COALESCE(d.amount,0) > 0
   AND COALESCE(d.amount_received,0) < 0.005;

-- How TDS actually appears: on how many invoices, and is amount_received the
-- gross or the net of it where a receipt EXISTS?
SELECT 'withTds=' || COUNT(*) FILTER (WHERE COALESCE(d.tds_amount,0) > 0)
    || ' paidAndTds=' || COUNT(*) FILTER (WHERE COALESCE(d.tds_amount,0) > 0 AND COALESCE(d.amount_received,0) > 0)
    || ' recdEqNet=' || COUNT(*) FILTER (WHERE COALESCE(d.tds_amount,0) > 0
           AND ABS(COALESCE(d.amount_received,0) - (d.amount - d.tds_amount)) < 1)
    || ' recdEqGross=' || COUNT(*) FILTER (WHERE COALESCE(d.tds_amount,0) > 0
           AND ABS(COALESCE(d.amount_received,0) - d.amount) < 1)
    AS tds_shape
  FROM public.he_dispatch d
  JOIN public.parties p ON p.id = d.party_id
 WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%') AND COALESCE(d.amount,0) > 0;
