-- Migration 1173: read-only. Verifying one thing before it is stated as fact.
--
-- 1171 found 4 farm expenses that never reached the cash book, worth Rs 132655.
-- 1172 found 4 farm expenses tagged to a flock, worth Rs 132655. Identical
-- count and identical amount strongly suggests they are the SAME four rows --
-- which would mean the only expenses a flock can see are exactly the ones no
-- imprest can see. Suggestive is not proof, so this checks it directly.
--
-- Nothing is written.

-- [1] The four flock-tagged rows, each with whether a cash_book row exists.
SELECT string_agg(t.txt, ' | ' ORDER BY t.d) AS flock_tagged_rows
FROM (
  SELECT fe.expense_date AS d,
         fe.expense_date::text || ' ' || COALESCE(f.name,'(no site)')
           || ' Flock ' || COALESCE(fl.flock_no,'?')
           || ' ' || fe.category || ' Rs ' || round(fe.amount)
           || ' -- cash_book row: '
           || CASE WHEN EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.farm_expense_id = fe.id)
                   THEN 'YES' ELSE 'NO' END AS txt
  FROM public.farm_expenses fe
  LEFT JOIN public.farms f ON f.id = fe.farm_id
  LEFT JOIN public.flocks fl ON fl.id = fe.flock_id
  WHERE fe.flock_id IS NOT NULL
) t;

-- [2] The full cross-tab: every farm expense by whether a flock can see it and
-- whether an imprest can see it. This is the whole answer in one row.
SELECT count(*)::int AS total,
       count(*) FILTER (WHERE fe.flock_id IS NOT NULL AND e.cash_account_id IS NOT NULL)::int AS both_flock_and_imprest,
       count(*) FILTER (WHERE fe.flock_id IS NOT NULL AND e.cash_account_id IS NULL)::int AS flock_only,
       count(*) FILTER (WHERE fe.flock_id IS NULL AND e.cash_account_id IS NOT NULL)::int AS imprest_only,
       count(*) FILTER (WHERE fe.flock_id IS NULL AND e.cash_account_id IS NULL)::int AS neither
FROM public.farm_expenses fe
LEFT JOIN public.cash_book cb ON cb.farm_expense_id = fe.id
LEFT JOIN public.v_imprest_entries e ON e.cash_book_id = cb.id;
