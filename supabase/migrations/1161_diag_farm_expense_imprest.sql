-- Migration 1161: read-only. How farm expenses land in the imprest accounts.
--
-- Farm Expenses already posts every expense to the cash book as a payment and
-- sets farm_id -- either the expense's own farm, or for a shared vehicle the
-- vehicle's farm, or failing both the HEAD OFFICE FARM'S ID. That last part
-- matters: it writes the id of the farm row coded 'HO', not NULL.
--
-- The derivation added in 1159/1160 resolves an imprest as:
--   1. an explicit cash_account_id, else
--   2. the site imprest whose farm_id matches the row's farm_id, else
--   3. HO Imprest, but ONLY when farm_id IS NULL.
--
-- Head Office is site_type 'office', so 1155 deliberately gave it no site
-- imprest. Its rows therefore match neither rule 2 (no site account) nor rule 3
-- (farm_id is not null) -- so an expense booked to Head Office may belong to no
-- imprest at all. 1159 reported 196 such rows. This measures whether those are
-- the Head Office ones and how many are farm expenses.
--
-- Nothing is written.

-- [1] The rows that resolve to no imprest, by the farm they carry.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.nm), 'NONE') AS orphan_rows_by_farm
FROM (
  SELECT COALESCE(f.name, '(no farm / NULL)') AS nm,
         COALESCE(f.name, '(no farm)') || ' [' || COALESCE(f.site_type,'-') || ']: '
           || count(*) || ' rows, Rs ' || round(sum(COALESCE(e.amount_out,0) + COALESCE(e.amount_in,0))) AS txt
  FROM public.v_imprest_entries e
  LEFT JOIN public.farms f ON f.id = e.farm_id
  WHERE e.cash_account_id IS NULL
  GROUP BY f.name, f.site_type
) t;

-- [2] Of those orphans, how many came from Farm Expenses specifically.
-- farm_expense_id is not carried on the view, so it is read from cash_book.
SELECT count(*)::int AS orphan_rows,
       count(*) FILTER (WHERE cb.farm_expense_id IS NOT NULL)::int AS from_farm_expenses,
       count(*) FILTER (WHERE e.nhe_sale_id IS NOT NULL)::int AS from_nhe_sales,
       count(*) FILTER (WHERE cb.farm_expense_id IS NULL AND e.nhe_sale_id IS NULL)::int AS other_sources,
       round(sum(COALESCE(e.amount_out,0)))::numeric AS orphan_paid_out
FROM public.v_imprest_entries e
LEFT JOIN public.cash_book cb ON cb.id = e.cash_book_id
WHERE e.cash_account_id IS NULL;

-- [3] Farm expenses overall: where they land, so the split between properly
-- resolved and orphaned is clear rather than inferred from the orphan side.
SELECT string_agg(t.txt, ' | ' ORDER BY t.nm) AS farm_expense_rows_by_imprest
FROM (
  SELECT COALESCE(a.name, 'NO IMPREST') AS nm,
         COALESCE(a.name, 'NO IMPREST') || ': ' || count(*) || ' rows, Rs '
           || round(sum(COALESCE(e.amount_out,0))) AS txt
  FROM public.v_imprest_entries e
  JOIN public.cash_book cb ON cb.id = e.cash_book_id
  LEFT JOIN public.cash_accounts a ON a.id = e.cash_account_id
  WHERE cb.farm_expense_id IS NOT NULL
  GROUP BY a.name
) t;

-- [4] Does a Head Office farm row actually exist, and does it have an imprest?
SELECT (SELECT string_agg(name || ' [' || COALESCE(site_type,'-') || ']', ' | ' ORDER BY name)
        FROM public.farms WHERE COALESCE(site_type,'laying') NOT IN ('rearing','laying')) AS non_site_farms,
       (SELECT count(*)::int FROM public.cash_accounts WHERE acct_type = 'site_petty') AS site_imprests,
       (SELECT count(*)::int FROM public.cash_book cb
        JOIN public.farms f ON f.id = cb.farm_id
        WHERE COALESCE(f.site_type,'laying') NOT IN ('rearing','laying')) AS cash_rows_at_non_site_farms;

-- [5] For completeness: total farm expenses and how many reached the cash book
-- at all, since an expense with no cash book row is invisible to every imprest.
SELECT (SELECT count(*)::int FROM public.farm_expenses) AS farm_expenses,
       (SELECT count(*)::int FROM public.cash_book WHERE farm_expense_id IS NOT NULL) AS with_cash_book_row,
       (SELECT count(*)::int FROM public.farm_expenses fe
        WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.farm_expense_id = fe.id)) AS never_reached_cash_book;
