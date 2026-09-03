-- Migration 1162: read-only. What is actually inside each imprest, and why.
--
-- Two fair challenges from the owner:
--
--   (a) Why are BANK payments showing in HO Imprest?
--       cash_book has always held cheque and UPI rows as well as cash --
--       payment_mode is one of cash / upi / cheque. The balance counts only
--       cash, but the LEDGER LISTS every row it resolves, so non-cash rows
--       appear in the list while contributing nothing to the figure. That is
--       confusing even though the balance is right.
--
--   (b) Why did EXPENSES come to the sites when only NHE sales were discussed?
--       Because the derivation I wrote is generic: ANY cash_book row carrying a
--       site resolves to that site's imprest -- salaries, electricity, farm
--       expenses, purchases, everything. That was not spelled out. It is
--       arguably what an imprest means (all cash in and out at that site), but
--       it is a far wider change than the sale receipts we were discussing.
--
-- This measures the composition so both answers are facts, not claims.
--
-- Nothing is written.

-- [1] HO Imprest by payment mode -- how much of it is not cash at all.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.md), 'NONE') AS ho_by_payment_mode
FROM (
  SELECT COALESCE(e.payment_mode,'cash') AS md,
         COALESCE(e.payment_mode,'cash') || ': ' || count(*) || ' rows, in Rs '
           || round(sum(COALESCE(e.amount_in,0))) || ', out Rs ' || round(sum(COALESCE(e.amount_out,0))) AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE a.acct_type = 'ho_imprest'
  GROUP BY COALESCE(e.payment_mode,'cash')
) t;

-- [2] HO Imprest by category -- what kinds of transaction landed there.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.c DESC), 'NONE') AS ho_by_category
FROM (
  SELECT count(*) AS c,
         COALESCE(e.category,'(none)') || ': ' || count(*) AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE a.acct_type = 'ho_imprest'
  GROUP BY COALESCE(e.category,'(none)')
) t;

-- [3] Every imprest: how many rows COUNT toward the balance versus are merely
-- listed. The gap between the two is the non-cash noise the owner is seeing.
SELECT string_agg(t.txt, ' | ' ORDER BY t.nm) AS counted_vs_listed
FROM (
  SELECT a.name AS nm,
         a.name || ': ' || count(*) || ' listed, '
           || count(*) FILTER (WHERE e.counts_to_balance) || ' counted' AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_accounts a ON a.id = e.cash_account_id
  GROUP BY a.name
) t;

-- [4] The site imprests by category -- to show plainly that they are NOT just
-- sale receipts, which is the owner's second point.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.c DESC), 'NONE') AS site_imprests_by_category
FROM (
  SELECT count(*) AS c,
         COALESCE(e.category,'(none)') || ': ' || count(*) AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE a.acct_type = 'site_petty'
  GROUP BY COALESCE(e.category,'(none)')
) t;

-- [5] How much of each site imprest's balance is sales versus everything else.
SELECT string_agg(t.txt, ' | ' ORDER BY t.nm) AS site_sales_vs_other
FROM (
  SELECT a.name AS nm,
         a.name || ': sales in Rs ' || round(COALESCE(sum(e.amount_in) FILTER (WHERE e.nhe_sale_id IS NOT NULL AND e.counts_to_balance),0))
           || ', other in Rs ' || round(COALESCE(sum(e.amount_in) FILTER (WHERE e.nhe_sale_id IS NULL AND e.counts_to_balance),0))
           || ', out Rs ' || round(COALESCE(sum(e.amount_out) FILTER (WHERE e.counts_to_balance),0)) AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE a.acct_type = 'site_petty'
  GROUP BY a.name
) t;
