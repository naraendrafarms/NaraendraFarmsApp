-- Migration 1140: the four money tables stop accepting writes from anyone.
--
-- Same hole as daily_records had: cash_book, he_dispatch, nhe_sales and
-- pending_payments all still carried migration 001's blanket auth_insert /
-- auth_update / auth_delete, so ANY signed-in user could insert or delete a
-- cash entry, a dispatch, a sale or a payable straight through the API. Only
-- the menu stood in the way.
--
-- WRITE is narrowed to admin, accounts, site_manager, site_incharge -- the same
-- four as daily_records. Deliberately conservative rather than accounts-only:
-- these tables are written from a LOT of screens (farm expenses, electricity,
-- generators, salary, purchase entry, flock sales, bulk daily entry), and
-- cutting a role that quietly posts from one of them would break real work.
-- What this removes is the roles that enter nothing anywhere -- management,
-- viewer and shed_supervisor -- plus any deactivated account.
--
-- READ stays open, as with daily_records: P&L, party ledger, outstanding
-- reports, dashboards and the payment planning screens all read these, and
-- management and viewer are meant to see them.
--
-- If accounts-only is wanted on cash_book and pending_payments later, that is a
-- one-line change to the role list -- but it should be a deliberate decision
-- with the screens checked first, not a guess made here.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cash_book','he_dispatch','nhe_sales','pending_payments']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_delete" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "money_write" ON public.%I', t);
    EXECUTE format($p$CREATE POLICY "money_write" ON public.%I FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid()) AND p.is_active
                       AND p.role IN ('admin','accounts','site_manager','site_incharge')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid()) AND p.is_active
                       AND p.role IN ('admin','accounts','site_manager','site_incharge')))$p$, t);
  END LOOP;
END
$$;

-- VERIFY 1: each table has exactly its read policy plus the new write policy,
-- and no blanket write survives. auth_select MUST still be present on all four
-- -- without it every P&L, ledger and outstanding report goes blank.
SELECT tablename,
       string_agg(policyname || ':' || cmd, ' | ' ORDER BY policyname) AS policies,
       count(*) FILTER (WHERE policyname = 'auth_select')::int AS read_open,
       count(*) FILTER (WHERE policyname IN ('auth_insert','auth_update','auth_delete'))::int AS blanket_left
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cash_book','he_dispatch','nhe_sales','pending_payments')
GROUP BY tablename ORDER BY tablename;

-- VERIFY 2: no row moved, and the cash_book sync triggers are still enabled --
-- those keep cash_book in step with sales, and a disabled one breaks the link
-- silently.
SELECT (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows,
       (SELECT count(*)::int FROM public.he_dispatch) AS he_dispatch_rows,
       (SELECT count(*)::int FROM public.nhe_sales) AS nhe_sales_rows,
       (SELECT count(*)::int FROM public.pending_payments) AS pending_payments_rows,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgrelid IN ('public.nhe_sales'::regclass,'public.he_dispatch'::regclass)
          AND NOT tgisinternal AND tgenabled::text = 'O') AS sales_triggers_enabled;
