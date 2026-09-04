-- Migration 1172: read-only. The second half of 1171, which never printed.
--
-- run_sql.py only prints a result for the first five statements (`i < 5` in the
-- print guard), so 1171's statements 5-8 ran but were never shown. Those are
-- exactly the ones that answer "is the expense linked to the flock". Split out
-- here, four statements, so every one of them prints.
--
-- The Financial and Cost & Income tabs read farm_expenses filtered on flock_id
-- and nothing else, so a blank flock_id means that cost reaches no flock.
--
-- Nothing is written.

-- [1] The headline: how many expenses carry a flock at all.
SELECT count(*)::int AS farm_expenses_total,
       count(*) FILTER (WHERE flock_id IS NOT NULL)::int AS tagged_to_a_flock,
       count(*) FILTER (WHERE flock_id IS NULL)::int AS no_flock_tag,
       round(COALESCE(sum(amount) FILTER (WHERE flock_id IS NOT NULL), 0))::numeric AS amount_on_flocks,
       round(COALESCE(sum(amount) FILTER (WHERE flock_id IS NULL), 0))::numeric AS amount_on_no_flock,
       count(*) FILTER (WHERE flock_id IS NULL AND farm_id IS NOT NULL)::int AS has_site_but_no_flock,
       count(*) FILTER (WHERE flock_id IS NOT NULL AND farm_id IS NULL)::int AS has_flock_but_no_site
FROM public.farm_expenses;

-- [2] Which flocks actually carry expenses, so "linked" can be seen.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.amt DESC), 'NO EXPENSE IS TAGGED TO ANY FLOCK') AS expenses_by_flock
FROM (
  SELECT sum(fe.amount) AS amt,
         'Flock ' || fl.flock_no || ': ' || count(*) || ' rows, Rs ' || round(sum(fe.amount)) AS txt
  FROM public.farm_expenses fe
  JOIN public.flocks fl ON fl.id = fe.flock_id
  GROUP BY fl.flock_no
) t;

-- [3] The same split by site, so it is clear which site's expenses are
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

-- [4] By month, to show whether flock tagging is recent practice or was never
-- done at all. The whole file spans Apr-Aug 2026, so month is the useful grain.
SELECT string_agg(t.txt, ' | ' ORDER BY t.mn) AS flock_tagging_by_month
FROM (
  SELECT to_char(fe.expense_date,'YYYY-MM') AS mn,
         to_char(fe.expense_date,'YYYY-MM') || ': ' || count(*) || ' rows, '
           || count(*) FILTER (WHERE fe.flock_id IS NOT NULL) || ' flock-tagged' AS txt
  FROM public.farm_expenses fe
  GROUP BY to_char(fe.expense_date,'YYYY-MM')
) t;
