-- Migration 1190: site and Head Office expenses reach the flocks that caused
-- them, so Financial and Cost & Income stop reading Rs 0.
--
-- THE OWNER'S RULE, confirmed against the data: a site's spending IS its
-- flock's cost. Only where two flocks genuinely share a site does it need
-- splitting -- measured as Kethireddypally only (2025-05, 2025-06, 2026-08,
-- 2026-09). Agraharam looked shared in 2026-06 but that was one empty row,
-- deleted by 1189.
--
-- ONE RULE DOES ALL OF IT. Split a site's expense across the flocks that had
-- birds at that site that month, in proportion to BIRD-DAYS. Where one flock
-- was there it takes 100% with no arithmetic -- exactly the owner's rule -- and
-- where two shared, it splits correctly without anyone having to remember which
-- months those were. Nothing needs special-casing, and a third flock or a newly
-- shared site cannot silently break it.
--
-- Bird-days, not headcount: a flock with twice the birds for twice as long
-- carries four times the share. It is also already how site salary and
-- electricity reach flocks in the Financial tab, so this stays consistent
-- instead of introducing a second competing method.
--
-- THREE ARMS:
--   direct -- the expense names a flock          -> 100% to it
--   site   -- names a site that HAD birds that month -> split by bird-days there
--   spread -- everything else (Head Office, Feed Mill, blank site, or a site
--             with no birds that month) -> split across ALL flocks with birds
--             that month, by bird-days
--
-- The third arm is deliberately defined by "no bird-days at that site" rather
-- than by naming Head Office: Head Office is a real farm row carrying a real
-- farm_id, so testing for NULL would have missed all 134 of its rows and made
-- them vanish instead of spreading.
--
-- NOTHING IS WRITTEN. This is a view: every figure is derived at read time and
-- can be traced back to the expense behind it.

DO $$
BEGIN
  DROP VIEW IF EXISTS public.v_flock_expense_allocation;
  DROP VIEW IF EXISTS public.v_flock_site_month_birddays;

  -- Bird-days per flock, per site, per month. One daily_records row is one shed
  -- for one day, so summing its opening birds gives bird-days directly.
  CREATE VIEW public.v_flock_site_month_birddays AS
  SELECT d.flock_id,
         sh.farm_id,
         to_char(d.record_date, 'YYYY-MM') AS ym,
         sum(COALESCE(d.opening_female,0) + COALESCE(d.opening_male,0))::numeric AS bird_days
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  GROUP BY d.flock_id, sh.farm_id, to_char(d.record_date, 'YYYY-MM')
  HAVING sum(COALESCE(d.opening_female,0) + COALESCE(d.opening_male,0)) > 0;

  CREATE VIEW public.v_flock_expense_allocation AS
  -- 1. DIRECT
  SELECT e.id AS expense_id, e.flock_id, e.farm_id, e.expense_date, e.category,
         e.description, e.vendor, e.amount AS full_amount,
         e.amount AS allocated_amount, 1::numeric AS share, 'direct'::text AS basis
  FROM public.farm_expenses e
  WHERE e.flock_id IS NOT NULL

  UNION ALL

  -- 2. SITE: the site had birds that month, so its own flocks carry it.
  SELECT e.id, b.flock_id, e.farm_id, e.expense_date, e.category,
         e.description, e.vendor, e.amount,
         e.amount * b.bird_days / t.bird_days,
         b.bird_days / t.bird_days, 'site'
  FROM public.farm_expenses e
  JOIN public.v_flock_site_month_birddays b
    ON b.farm_id = e.farm_id AND b.ym = to_char(e.expense_date, 'YYYY-MM')
  JOIN (SELECT farm_id, ym, sum(bird_days) AS bird_days
        FROM public.v_flock_site_month_birddays GROUP BY farm_id, ym) t
    ON t.farm_id = b.farm_id AND t.ym = b.ym AND t.bird_days > 0
  WHERE e.flock_id IS NULL AND e.farm_id IS NOT NULL

  UNION ALL

  -- 3. SPREAD: Head Office, Feed Mill, no site, or a site with no birds that
  -- month -- carried by every flock in proportion to its bird-days.
  SELECT e.id, b.flock_id, e.farm_id, e.expense_date, e.category,
         e.description, e.vendor, e.amount,
         e.amount * b.bird_days / t.bird_days,
         b.bird_days / t.bird_days, 'spread'
  FROM public.farm_expenses e
  JOIN (SELECT flock_id, ym, sum(bird_days) AS bird_days
        FROM public.v_flock_site_month_birddays GROUP BY flock_id, ym) b
    ON b.ym = to_char(e.expense_date, 'YYYY-MM')
  JOIN (SELECT ym, sum(bird_days) AS bird_days
        FROM public.v_flock_site_month_birddays GROUP BY ym) t
    ON t.ym = b.ym AND t.bird_days > 0
  WHERE e.flock_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.v_flock_site_month_birddays s
      WHERE s.farm_id = e.farm_id AND s.ym = to_char(e.expense_date, 'YYYY-MM'));
END
$$;

-- VERIFY 1: every rupee is accounted for. Allocated must equal the expenses it
-- covers -- a split that loses or invents money is worse than none.
SELECT (SELECT count(*)::int FROM public.farm_expenses) AS expenses,
       (SELECT round(sum(amount))::numeric FROM public.farm_expenses) AS billed_total,
       (SELECT round(sum(allocated_amount))::numeric FROM public.v_flock_expense_allocation) AS allocated_total,
       (SELECT count(DISTINCT expense_id)::int FROM public.v_flock_expense_allocation) AS expenses_reaching_a_flock;

-- VERIFY 2: which expenses reach NO flock, and why -- they are in a month where
-- no flock anywhere had birds, so there is nothing to carry them.
SELECT count(*)::int AS unallocated_rows,
       round(COALESCE(sum(e.amount),0))::numeric AS unallocated_value,
       COALESCE(string_agg(DISTINCT to_char(e.expense_date,'YYYY-MM'), ','), 'NONE') AS months
FROM public.farm_expenses e
WHERE NOT EXISTS (SELECT 1 FROM public.v_flock_expense_allocation a WHERE a.expense_id = e.id);

-- VERIFY 3: what each flock now carries, and by which arm.
SELECT string_agg(t.txt, ' | ' ORDER BY t.fno) AS by_flock
FROM (
  SELECT fl.flock_no AS fno,
         'Flock ' || fl.flock_no || ': Rs ' || round(sum(a.allocated_amount))
           || ' (direct ' || round(COALESCE(sum(a.allocated_amount) FILTER (WHERE a.basis='direct'),0))
           || ', site ' || round(COALESCE(sum(a.allocated_amount) FILTER (WHERE a.basis='site'),0))
           || ', spread ' || round(COALESCE(sum(a.allocated_amount) FILTER (WHERE a.basis='spread'),0)) || ')' AS txt
  FROM public.v_flock_expense_allocation a
  JOIN public.flocks fl ON fl.id = a.flock_id
  GROUP BY fl.flock_no
) t;
