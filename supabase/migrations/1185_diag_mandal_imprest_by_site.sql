-- Migration 1185: read-only. What is sitting in Mandal Imprest, by site, and
-- what would move if each row went to its own site's imprest instead.
--
-- WHY THESE ROWS ARE ON MANDAL AT ALL: the derivation has three steps -- an
-- explicit cash_account_id wins, else the site's own imprest, else HO Imprest.
-- Mandal is neither a site_petty nor the ho_imprest account, so a row can only
-- reach it by being TAGGED to it explicitly. Every Mandal row is therefore a
-- deliberate "Mandal paid this", not a fallback.
--
-- THE QUESTION THIS RAISES, which the numbers cannot answer: the app already
-- separates the two things. cash_book.farm_id says WHICH SITE BEARS THE COST;
-- cash_account_id says WHICH TIN THE CASH LEFT. A Bodjanampet-1 expense paid
-- out of Mandal's cash is correctly a Bpet-1 cost AND a Mandal payment. So
-- these rows are only wrong if Mandal did NOT actually hand over that cash.
--
-- Nothing is written.

-- [1] Mandal as it stands, and whether its rows really are all explicit.
SELECT count(*)::int AS rows,
       count(*) FILTER (WHERE e.derived)::int AS derived_not_tagged,
       count(*) FILTER (WHERE NOT e.derived)::int AS explicitly_tagged,
       round(sum(COALESCE(e.amount_in,0)))::numeric AS cash_in,
       round(sum(COALESCE(e.amount_out,0)))::numeric AS cash_out,
       (SELECT round(opening_balance)::numeric FROM public.cash_accounts WHERE name = 'Mandal Imprest') AS opening,
       (SELECT round(balance)::numeric FROM public.v_cash_account_balance WHERE name = 'Mandal Imprest') AS balance
FROM public.v_imprest_entries e
JOIN public.cash_accounts a ON a.id = e.cash_account_id
WHERE a.name = 'Mandal Imprest';

-- [2] Mandal's rows broken down by the SITE each one carries.
SELECT string_agg(t.txt, ' | ' ORDER BY t.amt DESC) AS mandal_by_site
FROM (
  SELECT sum(COALESCE(e.amount_out,0)) AS amt,
         COALESCE(e.farm_name,'(no site)') || ': ' || count(*) || ' rows, out Rs '
           || round(sum(COALESCE(e.amount_out,0)))
           || CASE WHEN sum(COALESCE(e.amount_in,0)) > 0
                   THEN ', in Rs ' || round(sum(COALESCE(e.amount_in,0))) ELSE '' END AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE a.name = 'Mandal Imprest'
  GROUP BY e.farm_name
) t;

-- [3] Of those, how many could actually move: a row can only go to a site
-- imprest if that site HAS one. Head Office has none, so its rows would fall
-- to HO Imprest instead, and a row with no site would too.
SELECT count(*)::int AS mandal_rows,
       count(*) FILTER (WHERE sa.id IS NOT NULL)::int AS would_move_to_a_site_imprest,
       count(*) FILTER (WHERE sa.id IS NULL)::int AS would_fall_to_ho_imprest,
       round(sum(COALESCE(e.amount_out,0)) FILTER (WHERE sa.id IS NOT NULL))::numeric AS out_moving_to_sites,
       round(sum(COALESCE(e.amount_out,0)) FILTER (WHERE sa.id IS NULL))::numeric AS out_falling_to_ho
FROM public.v_imprest_entries e
JOIN public.cash_accounts a ON a.id = e.cash_account_id
LEFT JOIN public.cash_accounts sa
       ON sa.farm_id = e.farm_id AND sa.acct_type = 'site_petty' AND sa.is_active
WHERE a.name = 'Mandal Imprest';

-- [4] Every account's balance BEFORE, so the after-figures can be compared to
-- something rather than trusted.
SELECT string_agg(name || ': ' || round(balance), ' | ' ORDER BY sort_order, name) AS balances_now
FROM public.v_cash_account_balance WHERE is_active;

-- [5] What each account's balance WOULD BECOME if every Mandal row moved to the
-- imprest its own site implies. Computed, not applied.
SELECT string_agg(t.nm || ': ' || round(t.bal), ' | ' ORDER BY t.nm) AS balances_if_moved
FROM (
  SELECT a.name AS nm,
         a.opening_balance + COALESCE(sum(x.amount_in) - sum(x.amount_out), 0) AS bal
  FROM public.cash_accounts a
  LEFT JOIN (
    SELECT COALESCE(sa.id, ho.id, e.cash_account_id) AS acct,
           COALESCE(e.amount_in,0) AS amount_in, COALESCE(e.amount_out,0) AS amount_out
    FROM public.v_imprest_entries e
    LEFT JOIN public.cash_accounts ma ON ma.id = e.cash_account_id AND ma.name = 'Mandal Imprest'
    LEFT JOIN public.cash_accounts sa
           ON ma.id IS NOT NULL AND sa.farm_id = e.farm_id
          AND sa.acct_type = 'site_petty' AND sa.is_active
    LEFT JOIN LATERAL (
      SELECT h.id FROM public.cash_accounts h
      WHERE ma.id IS NOT NULL AND h.acct_type = 'ho_imprest' AND h.is_active
      ORDER BY h.sort_order LIMIT 1
    ) ho ON TRUE
    WHERE e.counts_to_balance
  ) x ON x.acct = a.id
  WHERE a.is_active
  GROUP BY a.name, a.opening_balance
) t;
