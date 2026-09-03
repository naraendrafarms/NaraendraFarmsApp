-- Migration 1165: lock the remaining key tables to the roles that enter data.
--
-- The audit found 122 of 137 tables still carrying migration 001's blanket
-- write policies, so any signed-in user could insert, change or delete a row
-- through the API. daily_records and the four money tables were locked earlier;
-- these seven are the ones that matter most and were still open:
--
--   bank_transactions    -- about Rs 10 crore of payments, the only money table
--                           still unlocked
--   salary_monthly       -- what everyone is paid
--   employee_advances    -- money handed to staff
--   employee_deductions  -- what is recovered from wages, and now what marks a
--                           sale settled
--   farm_expenses        -- every site cost
--   flocks, sheds        -- the masters every daily record hangs off
--
-- SAME FOUR ROLES as daily_records and the money tables: admin, accounts,
-- site_manager, site_incharge, and the profile must be active. That removes
-- exactly three roles -- management, viewer and shed_supervisor -- none of which
-- enters data anywhere, so no working screen loses anything.
--
-- READS STAY OPEN on all seven. Dashboards, P&L, salary reports, flock
-- summaries and the imprest views all read these, and management and viewer are
-- meant to see them. Narrowing SELECT would blank working screens.
--
-- Policies are dropped BY ENUMERATION, not by name. Three earlier attempts on
-- the money tables each missed a policy nobody had written down -- auth_all on
-- one table, four "Authenticated users can ..." on another, then a stray
-- auth_delete_pending_payments. Whatever these are called, they go.

DO $$
DECLARE
  t TEXT;
  r RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['bank_transactions','salary_monthly','employee_advances',
                           'employee_deductions','farm_expenses','flocks','sheds']
  LOOP
    -- Remove every existing policy on the table, whatever it is called.
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;

    -- Read for anyone signed in: reports and dashboards depend on it.
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR SELECT
      USING (auth.role() = 'authenticated')$p$, t || '_read', t);

    -- Write for the four roles that actually enter data.
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid()) AND p.is_active
                       AND p.role IN ('admin','accounts','site_manager','site_incharge')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid()) AND p.is_active
                       AND p.role IN ('admin','accounts','site_manager','site_incharge')))$p$,
      t || '_write', t);
  END LOOP;
END
$$;

-- VERIFY 1: each of the seven has exactly one read policy and one write policy,
-- and no leftover that lets anyone write. write_holes must be 0 on every row.
SELECT tablename,
       count(*)::int AS policies,
       count(*) FILTER (WHERE cmd = 'SELECT')::int AS read_policies,
       count(*) FILTER (WHERE cmd <> 'SELECT' AND policyname NOT LIKE '%\_write')::int AS write_holes
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bank_transactions','salary_monthly','employee_advances',
                    'employee_deductions','farm_expenses','flocks','sheds')
GROUP BY tablename ORDER BY tablename;

-- VERIFY 2: not a row lost on any of them, and how many tables across the
-- schema any signed-in user can still write -- the number that started at 122.
SELECT (SELECT count(*)::int FROM public.bank_transactions) AS bank_txns,
       (SELECT count(*)::int FROM public.salary_monthly) AS salaries,
       (SELECT count(*)::int FROM public.employee_advances) AS advances,
       (SELECT count(*)::int FROM public.employee_deductions) AS deductions,
       (SELECT count(*)::int FROM public.farm_expenses) AS expenses,
       (SELECT count(*)::int FROM public.flocks) AS flocks,
       (SELECT count(*)::int FROM public.sheds) AS sheds,
       (SELECT count(DISTINCT tablename)::int FROM pg_policies
        WHERE schemaname='public' AND cmd <> 'SELECT'
          AND qual IS NOT NULL AND qual NOT ILIKE '%profiles%') AS tables_still_open;
