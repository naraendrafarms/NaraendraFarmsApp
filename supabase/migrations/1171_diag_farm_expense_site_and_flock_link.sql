-- Migration 1171: read-only. Two questions, measured rather than assumed.
--
--  A. Does EVERY Purchase -> Farm Expenses row reach Accounts -> Imprest
--     Ledger, under the right site?
--  B. Is that same row linked to the flock, so it shows in Flock Management ->
--     flock -> Financial and Cost & Income?
--
-- The two screens read the row through two DIFFERENT tags on it:
--   Imprest Ledger  -> cash_book.farm_id  (site) -> derived imprest account
--   Flock Financial -> farm_expenses.flock_id    (flock, read directly)
-- So an expense can satisfy one and miss the other. This counts both.
--
-- Three separate ways a farm expense can fail to appear on the Imprest Ledger:
--   1. no cash_book row at all              -> invisible everywhere
--   2. cash_book row resolves to no imprest -> only under "Not assigned"
--   3. payment_mode is not cash             -> ledger filters counts_to_balance
--
-- Nothing is written.

-- [1] Did every expense reach the cash book at all? An expense with no
-- cash_book row cannot appear on the Imprest Ledger by any route.
SELECT (SELECT count(*)::int FROM public.farm_expenses) AS farm_expenses_total,
       (SELECT round(sum(amount))::numeric FROM public.farm_expenses) AS total_amount,
       (SELECT count(*)::int FROM public.farm_expenses fe
        WHERE EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.farm_expense_id = fe.id)) AS reached_cash_book,
       (SELECT count(*)::int FROM public.farm_expenses fe
        WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.farm_expense_id = fe.id)) AS never_reached_cash_book,
       (SELECT round(sum(fe.amount))::numeric FROM public.farm_expenses fe
        WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.farm_expense_id = fe.id)) AS amount_not_in_cash_book,
       (SELECT min(expense_date)::text || ' to ' || max(expense_date)::text FROM public.farm_expenses) AS date_span;

-- [2] Of the farm-expense rows that DID reach the cash book: which imprest do
-- they resolve to, and are they cash (listed on the ledger) or not.
SELECT string_agg(t.txt, ' | ' ORDER BY t.nm) AS farm_expenses_by_imprest
FROM (
  SELECT COALESCE(a.name, 'ZZ NO IMPREST') AS nm,
         COALESCE(a.name, 'NO IMPREST AT ALL') || ': ' || count(*) || ' rows, Rs '
           || round(sum(COALESCE(e.amount_out,0)))
           || ' (cash ' || count(*) FILTER (WHERE e.counts_to_balance)
           || ', non-cash ' || count(*) FILTER (WHERE NOT e.counts_to_balance) || ')' AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_book cb ON cb.id = e.cash_book_id
  LEFT JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE cb.farm_expense_id IS NOT NULL
  GROUP BY a.name
) t;

-- [3] The single answer to question A: of every farm expense, how many are
-- actually VISIBLE on the Imprest Ledger (resolved to an account AND cash),
-- and how many fall out at each of the three points.
SELECT count(*)::int AS farm_expenses_total,
       count(*) FILTER (WHERE cb.id IS NULL)::int AS miss_1_no_cash_book_row,
       count(*) FILTER (WHERE cb.id IS NOT NULL AND e.cash_account_id IS NULL)::int AS miss_2_no_imprest,
       count(*) FILTER (WHERE cb.id IS NOT NULL AND e.cash_account_id IS NOT NULL
                          AND NOT e.counts_to_balance)::int AS miss_3_not_cash_so_hidden,
       count(*) FILTER (WHERE cb.id IS NOT NULL AND e.cash_account_id IS NOT NULL
                          AND e.counts_to_balance)::int AS visible_on_imprest_ledger,
       round(sum(fe.amount) FILTER (WHERE cb.id IS NULL OR e.cash_account_id IS NULL
                          OR NOT e.counts_to_balance))::numeric AS amount_not_visible
FROM public.farm_expenses fe
LEFT JOIN public.cash_book cb ON cb.farm_expense_id = fe.id
LEFT JOIN public.v_imprest_entries e ON e.cash_book_id = cb.id;

-- [4] The rows that resolve to no imprest, by the site they carry -- so it is
-- clear WHICH site is missing an account rather than just how many rows.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.nm), 'NONE') AS no_imprest_by_site
FROM (
  SELECT COALESCE(f.name, '(no site / NULL)') AS nm,
         COALESCE(f.name, '(no site)') || ' [' || COALESCE(f.site_type,'-') || ']: '
           || count(*) || ' rows, Rs ' || round(sum(COALESCE(e.amount_out,0))) AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_book cb ON cb.id = e.cash_book_id
  LEFT JOIN public.farms f ON f.id = e.farm_id
  WHERE cb.farm_expense_id IS NOT NULL AND e.cash_account_id IS NULL
  GROUP BY f.name, f.site_type
) t;

-- [5] Question B: is the expense linked to a flock at all. This is what the
-- Financial / Cost & Income tabs read -- they filter farm_expenses on flock_id
-- and nothing else, so a blank flock_id means the cost never reaches any flock.
SELECT count(*)::int AS farm_expenses_total,
       count(*) FILTER (WHERE flock_id IS NOT NULL)::int AS tagged_to_a_flock,
       count(*) FILTER (WHERE flock_id IS NULL)::int AS no_flock_tag,
       round(sum(amount) FILTER (WHERE flock_id IS NOT NULL))::numeric AS amount_on_flocks,
       round(sum(amount) FILTER (WHERE flock_id IS NULL))::numeric AS amount_on_no_flock,
       count(*) FILTER (WHERE flock_id IS NULL AND farm_id IS NOT NULL)::int AS has_site_but_no_flock,
       count(*) FILTER (WHERE flock_id IS NOT NULL AND farm_id IS NULL)::int AS has_flock_but_no_site;

-- [6] Which flocks actually carry expenses, so "linked" can be seen rather
-- than believed.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.amt DESC), 'NO EXPENSE IS TAGGED TO ANY FLOCK') AS expenses_by_flock
FROM (
  SELECT sum(fe.amount) AS amt,
         'Flock ' || fl.flock_no || ': ' || count(*) || ' rows, Rs ' || round(sum(fe.amount)) AS txt
  FROM public.farm_expenses fe
  JOIN public.flocks fl ON fl.id = fe.flock_id
  GROUP BY fl.flock_no
) t;

-- [7] Same split by site, so the owner can see which site's expenses are
-- flock-tagged and which are not.
SELECT string_agg(t.txt, ' | ' ORDER BY t.nm) AS flock_tagging_by_site
FROM (
  SELECT COALESCE(f.name, '(no site)') AS nm,
         COALESCE(f.name, '(no site)') || ': ' || count(*) || ' rows, '
           || count(*) FILTER (WHERE fe.flock_id IS NOT NULL) || ' on a flock, '
           || count(*) FILTER (WHERE fe.flock_id IS NULL) || ' not' AS txt
  FROM public.farm_expenses fe
  LEFT JOIN public.farms f ON f.id = fe.farm_id
  GROUP BY f.name
) t;

-- [8] Is the flock tagging recent practice or historical? If the untagged rows
-- are all old, the habit may already have changed.
SELECT string_agg(t.txt, ' | ' ORDER BY t.yr DESC) AS flock_tagging_by_year
FROM (
  SELECT to_char(fe.expense_date,'YYYY') AS yr,
         to_char(fe.expense_date,'YYYY') || ': ' || count(*) || ' rows, '
           || count(*) FILTER (WHERE fe.flock_id IS NOT NULL) || ' flock-tagged' AS txt
  FROM public.farm_expenses fe
  GROUP BY to_char(fe.expense_date,'YYYY')
) t;
