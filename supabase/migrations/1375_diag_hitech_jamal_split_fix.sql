-- READ ONLY. Re-runs the two statements that errored in 1374.
--
-- 1374 reported Errors: 2, honestly - the message was not one of the phrases
-- run_sql.py swallows, so the log showed it:
--   ERROR: 42803: aggregate functions are not allowed in GROUP BY
-- I wrote GROUP BY 1, and column 1 was the assembled string, which contains
-- COUNT(*). Grouping by the raw columns instead. My error, not a data problem.
--
-- 1374's other three statements stand: all four matching parties hold a ZERO
-- advance balance; 144 unpaid invoices from 18/08/2025 to 29/03/2026 totalling
-- Rs 26.82 cr; and of the 79 invoices that carry TDS and have a receipt,
-- amount_received equals amount minus TDS in ALL 79 and equals the gross in
-- none - so the app already records receipts NET of TDS.

SELECT COALESCE(string_agg(x.line, ' ~ ' ORDER BY x.line), 'none') AS by_party_flock
  FROM ( SELECT left(p.name, 20) || '|F' || f.flock_no
                || '|n=' || COUNT(*)
                || '|due=' || ROUND(SUM(d.amount - COALESCE(d.amount_received,0))/100000.0, 1) || 'L' AS line
           FROM public.he_dispatch d
           JOIN public.parties p ON p.id = d.party_id
           JOIN public.flocks  f ON f.id = d.flock_id
          WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%')
            AND f.flock_no IN ('19','20') AND COALESCE(d.amount,0) > 0
          GROUP BY p.name, f.flock_no ) x;

SELECT COALESCE(string_agg(x.line, ' ~ ' ORDER BY x.line), 'none') AS bank_by_party
  FROM ( SELECT left(p.name, 20)
                || '|n=' || COUNT(*)
                || '|tot=' || ROUND(SUM(b.amount)/100000.0, 1) || 'L'
                || '|unlinked=' || COUNT(*) FILTER (WHERE b.he_dispatch_id IS NULL AND b.nhe_sale_id IS NULL) AS line
           FROM public.bank_transactions b
           JOIN public.parties p ON p.id = b.party_id
          WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%') AND b.txn_type = 'Credit'
          GROUP BY p.name ) x;

-- Which flocks these two buyers actually bought from, in case 19 and 20 are
-- not where their invoices sit.
SELECT COALESCE(string_agg(x.line, ' ~ ' ORDER BY x.line), 'none') AS flocks_involved
  FROM ( SELECT 'F' || f.flock_no || '=' || COUNT(*) AS line
           FROM public.he_dispatch d
           JOIN public.parties p ON p.id = d.party_id
           JOIN public.flocks  f ON f.id = d.flock_id
          WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%') AND COALESCE(d.amount,0) > 0
          GROUP BY f.flock_no ) x;
