-- Migration 1143: remove every leftover policy on the four money tables, by
-- enumeration rather than by guessing names.
--
-- Twice now a lock has been written against a list of policy names I expected,
-- and twice the table held a name nobody had written down:
--   1140 missed  auth_all  on cash_book and the four "Authenticated users can
--                ..." policies on pending_payments
--   1142 missed  auth_delete_pending_payments  -- a THIRD naming style on the
--                same table, still allowing any signed-in user to DELETE a
--                payable.
--
-- So this stops naming them. It walks pg_policies and drops everything on these
-- four tables that is not one of the two intended policies, then guarantees a
-- read policy exists. Whatever the stragglers are called, they go.
--
-- End state per table, exactly:
--   <table>_read : SELECT for any signed-in user   (reports must keep working)
--   money_write  : ALL for active admin / accounts / site_manager / site_incharge

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('cash_book','he_dispatch','nhe_sales','pending_payments')
      AND policyname <> 'money_write'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  -- Put one read policy back on each. Dropping every non-money_write policy
  -- above took the SELECT policies with it, so this is not optional: without
  -- it the Cash Book, party ledger, P&L and outstanding reports go blank.
  FOR r IN
    SELECT unnest(ARRAY['cash_book','he_dispatch','nhe_sales','pending_payments']) AS tablename
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')',
                   r.tablename || '_read', r.tablename);
  END LOOP;
END
$$;

-- VERIFY 1: exactly two policies per table -- one SELECT, one money_write --
-- and write_holes 0 everywhere. This is the check both earlier attempts failed.
SELECT tablename,
       string_agg(policyname || ':' || cmd, ' | ' ORDER BY policyname) AS policies,
       count(*)::int AS total_policies,
       count(*) FILTER (WHERE cmd = 'SELECT')::int AS read_policies,
       count(*) FILTER (WHERE cmd <> 'SELECT' AND policyname <> 'money_write')::int AS write_holes
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cash_book','he_dispatch','nhe_sales','pending_payments')
GROUP BY tablename ORDER BY tablename;

-- VERIFY 2: nothing lost, triggers alive, cash_book still linked to its sales.
SELECT (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows,
       (SELECT count(*)::int FROM public.he_dispatch) AS he_dispatch_rows,
       (SELECT count(*)::int FROM public.nhe_sales) AS nhe_sales_rows,
       (SELECT count(*)::int FROM public.pending_payments) AS pending_payments_rows,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgrelid IN ('public.nhe_sales'::regclass,'public.he_dispatch'::regclass)
          AND NOT tgisinternal AND tgenabled::text = 'O') AS sales_triggers_enabled,
       (SELECT count(*)::int FROM public.cash_book
        WHERE nhe_sale_id IS NOT NULL OR he_dispatch_id IS NOT NULL) AS linked_cash_rows,
       (SELECT count(*)::int FROM pg_policies WHERE schemaname='public'
          AND tablename='daily_records' AND cmd <> 'SELECT'
          AND policyname <> 'daily_records_write') AS daily_records_holes;
