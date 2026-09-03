-- Migration 1153: read-only. The cash book rows already tagged to an imprest.
--
-- 1152's verification reported rows_tagged = 10, meaning entries are being
-- tagged in earnest. Worth listing them before anyone relies on the balances,
-- particularly any entered before the cash-only rule went in -- a cheque or UPI
-- row tagged to a holder is now listed but NOT counted, and the owner should
-- see which those are rather than discover it from a balance that looks short.
--
-- Split across statements and kept short per row, because the job log truncates
-- a long line and a truncated list is not a list.

-- [1] Headline: how many, how they split by mode, and the effect on balances.
SELECT count(*)::int AS tagged_rows,
       count(*) FILTER (WHERE COALESCE(payment_mode,'cash') = 'cash')::int AS cash_counted,
       count(*) FILTER (WHERE COALESCE(payment_mode,'cash') <> 'cash')::int AS non_cash_not_counted,
       sum(COALESCE(amount_in,0)) FILTER (WHERE COALESCE(payment_mode,'cash')='cash')::numeric AS cash_in,
       sum(COALESCE(amount_out,0)) FILTER (WHERE COALESCE(payment_mode,'cash')='cash')::numeric AS cash_out,
       count(*) FILTER (WHERE farm_id IS NULL)::int AS no_site_set
FROM public.cash_book WHERE cash_account_id IS NOT NULL;

-- [2] Per account: what each imprest now holds from tagged entries.
SELECT string_agg(t.txt, ' || ' ORDER BY t.nm) AS by_account
FROM (
  SELECT ca.name AS nm,
         ca.name || ': ' || count(*) || ' rows, in ' || sum(COALESCE(cb.amount_in,0))
           || ', out ' || sum(COALESCE(cb.amount_out,0)) AS txt
  FROM public.cash_book cb JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
  GROUP BY ca.name
) t;

-- [3] Rows 1-5, oldest first.
SELECT string_agg(t.txt, ' || ' ORDER BY t.rn) AS rows_1_to_5
FROM (
  SELECT row_number() OVER (ORDER BY cb.txn_date, cb.created_at) AS rn,
         cb.txn_date || ' ' || cb.txn_type || ' ' || COALESCE(ca.name,'?')
           || ' in=' || COALESCE(cb.amount_in,0) || ' out=' || COALESCE(cb.amount_out,0)
           || ' [' || COALESCE(cb.payment_mode,'cash') || '] '
           || COALESCE(f.name,'no site') || ' :: ' || left(COALESCE(cb.description,''), 38) AS txt
  FROM public.cash_book cb
  JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
  LEFT JOIN public.farms f ON f.id = cb.farm_id
) t WHERE t.rn <= 5;

-- [4] Rows 6-10.
SELECT string_agg(t.txt, ' || ' ORDER BY t.rn) AS rows_6_to_10
FROM (
  SELECT row_number() OVER (ORDER BY cb.txn_date, cb.created_at) AS rn,
         cb.txn_date || ' ' || cb.txn_type || ' ' || COALESCE(ca.name,'?')
           || ' in=' || COALESCE(cb.amount_in,0) || ' out=' || COALESCE(cb.amount_out,0)
           || ' [' || COALESCE(cb.payment_mode,'cash') || '] '
           || COALESCE(f.name,'no site') || ' :: ' || left(COALESCE(cb.description,''), 38) AS txt
  FROM public.cash_book cb
  JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
  LEFT JOIN public.farms f ON f.id = cb.farm_id
) t WHERE t.rn BETWEEN 6 AND 12;

-- [5] Anything to be careful of: non-cash rows named explicitly, and whether
-- any tagged row is one leg of a transfer whose partner is missing.
SELECT COALESCE((SELECT string_agg(cb.txn_date || ' ' || ca.name || ' ' || cb.payment_mode
                                   || ' ' || COALESCE(cb.amount_out, cb.amount_in), ' | ')
                 FROM public.cash_book cb JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
                 WHERE COALESCE(cb.payment_mode,'cash') <> 'cash'), 'NONE - all tagged rows are cash') AS non_cash_rows,
       (SELECT count(*)::int FROM public.cash_book WHERE transfer_group_id IS NOT NULL) AS cash_transfer_legs,
       (SELECT count(*)::int FROM public.bank_transactions WHERE transfer_group_id IS NOT NULL) AS bank_transfer_legs;
