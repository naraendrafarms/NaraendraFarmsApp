-- A salary calculated before its month has ended is PROVISIONAL, not cost.
--
-- Save & Calculate Salaries had no guard of any kind: one click upserts every
-- employee's row for the selected month. Pressed by mistake on 19/09/2026 with
-- September still running and attendance still being entered daily, it wrote
-- 268 rows totalling Rs 40,28,381 - about 20 per cent above August for the same
-- people, because the rest of the month's absences are not marked yet. None of
-- it was paid (is_paid false, paid_date NULL on all 268), but Cost Analysis and
-- the financial-year total read salary_monthly by month with no is_paid filter,
-- and Reports read v_salary_abstract off the same table - so a part-month figure
-- was showing as real September salary cost.
--
-- The button is being guarded in the frontend as well. This is the other half:
-- a row calculated mid-month is marked provisional, and the cost reports leave
-- it out, so even a deliberate mid-month run can never silently become cost.
--
-- NO EXISTING ROW IS UPDATED. The column defaults to FALSE, which means final -
-- exactly how every row written until now has been treated. The 268 September
-- rows therefore stay as they are and keep showing in the cost reports until
-- the owner says whether to flag them.

ALTER TABLE public.salary_monthly
  ADD COLUMN IF NOT EXISTS provisional BOOLEAN NOT NULL DEFAULT FALSE;

-- Rule 2: a view whose columns or filter change must be dropped first;
-- CREATE OR REPLACE silently keeps the old definition.
DROP VIEW IF EXISTS public.v_salary_abstract;

CREATE VIEW public.v_salary_abstract AS
SELECT
  e.farm_id                                   AS farm_id,
  s.month                                     AS month,
  SUM(COALESCE(s.earned_salary, 0))           AS total_salary,
  SUM(COALESCE(s.advance, 0))                 AS total_advance,
  SUM(COALESCE(s.tds, 0))                     AS total_tds,
  SUM(COALESCE(s.net_salary, 0))              AS net_salary,
  COUNT(*)                                    AS employee_count
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE NOT COALESCE(s.provisional, FALSE)
GROUP BY e.farm_id, s.month;

GRANT SELECT ON public.v_salary_abstract TO authenticated;

-- The only statement here that returns rows, so the only one the job log will
-- print. It has to carry every check on its own.
SELECT
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema='public' AND table_name='salary_monthly'
      AND column_name='provisional')                       AS column_exists,
  (SELECT count(*)::int FROM public.salary_monthly)        AS salary_rows_total,
  (SELECT count(*)::int FROM public.salary_monthly
    WHERE provisional)                                     AS flagged_provisional,
  (SELECT count(*)::int FROM public.salary_monthly
    WHERE month = date '2026-09-01')                       AS september_rows_untouched,
  (SELECT count(*)::int FROM public.v_salary_abstract)     AS view_rows,
  (SELECT round(SUM(net_salary))::bigint
     FROM public.v_salary_abstract)                        AS view_total_net;
