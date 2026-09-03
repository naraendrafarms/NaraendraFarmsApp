-- Migration 1142: finish what 1140 only half did.
--
-- 1140 dropped auth_insert / auth_update / auth_delete and added money_write.
-- Its own verification showed that was not enough on two of the four tables,
-- because they carry DIFFERENTLY NAMED catch-alls that 1140 never looked for:
--
--   cash_book        auth_all:ALL          -- one policy covering every command
--   pending_payments "Authenticated users can insert/update/delete/read
--                     pending_payments"    -- four separately named policies
--
-- Postgres ORs permissive policies together, so while those survive, ANY
-- signed-in user can still write both tables. The lock on cash_book and
-- pending_payments was therefore cosmetic. he_dispatch and nhe_sales came out
-- correctly locked (auth_select:SELECT | money_write:ALL) and are not touched
-- here.
--
-- cash_book has NO auth_select of its own -- auth_all was doing the reading
-- too. Dropping it without putting a SELECT policy back would blank the Cash
-- Book, party ledger, P&L and every outstanding report. So a read policy is
-- created FIRST, in the same statement, before the catch-all goes.

DO $$
BEGIN
  -- cash_book: read for everyone signed in, write for the four entry roles.
  DROP POLICY IF EXISTS "cash_book_read" ON public.cash_book;
  CREATE POLICY "cash_book_read" ON public.cash_book FOR SELECT
    USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "auth_all" ON public.cash_book;

  -- pending_payments: the four named catch-alls go, replaced the same way.
  DROP POLICY IF EXISTS "pending_payments_read" ON public.pending_payments;
  CREATE POLICY "pending_payments_read" ON public.pending_payments FOR SELECT
    USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "Authenticated users can insert pending_payments" ON public.pending_payments;
  DROP POLICY IF EXISTS "Authenticated users can update pending_payments" ON public.pending_payments;
  DROP POLICY IF EXISTS "Authenticated users can delete pending_payments" ON public.pending_payments;
  DROP POLICY IF EXISTS "Authenticated users can read pending_payments" ON public.pending_payments;
  DROP POLICY IF EXISTS "auth_all" ON public.pending_payments;
END
$$;

-- VERIFY 1: for each of the four money tables -- exactly one SELECT policy and
-- the money_write policy, and NO surviving policy that lets any authenticated
-- user write. write_holes must be 0 on every row.
SELECT tablename,
       string_agg(policyname || ':' || cmd, ' | ' ORDER BY policyname) AS policies,
       count(*) FILTER (WHERE cmd = 'SELECT')::int AS read_policies,
       count(*) FILTER (WHERE policyname = 'money_write')::int AS has_money_write,
       count(*) FILTER (WHERE cmd <> 'SELECT' AND policyname <> 'money_write')::int AS write_holes
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cash_book','he_dispatch','nhe_sales','pending_payments')
GROUP BY tablename ORDER BY tablename;

-- VERIFY 2: not a row lost, and the cash_book sync triggers still enabled --
-- those keep cash_book in step with nhe_sales and he_dispatch, and a disabled
-- one breaks the link with no error at all.
SELECT (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows,
       (SELECT count(*)::int FROM public.he_dispatch) AS he_dispatch_rows,
       (SELECT count(*)::int FROM public.nhe_sales) AS nhe_sales_rows,
       (SELECT count(*)::int FROM public.pending_payments) AS pending_payments_rows,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgrelid IN ('public.nhe_sales'::regclass,'public.he_dispatch'::regclass)
          AND NOT tgisinternal AND tgenabled::text = 'O') AS sales_triggers_enabled,
       (SELECT count(*)::int FROM public.cash_book WHERE nhe_sale_id IS NOT NULL
                                                      OR he_dispatch_id IS NOT NULL) AS linked_cash_rows;
