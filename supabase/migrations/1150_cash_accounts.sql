-- Migration 1150: cash imprest accounts.
--
-- OWNER'S ANSWERS, recorded so the shape is traceable:
--   * Four accounts: Mandal Imprest, HO Imprest, Dendi Naraendra Reddy Imprest,
--     Dendi Srinath Reddy Imprest.
--   * Mandal Imprest is ONE account, not one per mandal.
--   * The named people are HOLDERS, not payees -- "X Imprest" carries a
--     balance that the holder later accounts for. Money moved to them is an
--     internal transfer, not an expense.
--   * Cash arrives from NHE sales of all types, and from internal transfers.
--   * The cash book stays the single place to see every transaction.
--
-- THE FIX IN ONE LINE: cash_book.farm_id was doing two jobs -- which SITE bears
-- the cost and, implicitly, where the cash sits. cash_account_id now carries
-- the second job. farm_id keeps its exact present meaning, so every existing
-- report, P&L and site expense figure is untouched.
--
-- DELIBERATELY NOT DONE HERE: no existing row is backfilled and no opening
-- balance is set. Historical rows genuinely do not record which box the cash
-- was in, and inventing that would put false balances on real accounts. Every
-- one of the 1,254 existing rows keeps cash_account_id NULL -- "not assigned to
-- an imprest" -- until the owner gives a cutover date and the opening balance
-- each account held on it. Balances therefore start at zero and are honest.
--
-- transfer_group_id pairs the two legs of an internal transfer. Today they are
-- two loose rows and deleting one silently unbalances the book.

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.cash_accounts (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name         TEXT NOT NULL UNIQUE,
    acct_type    TEXT NOT NULL DEFAULT 'person'
                 CHECK (acct_type IN ('ho_imprest','mandal_imprest','site_petty','person')),
    employee_id  UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    farm_id      UUID REFERENCES public.farms(id) ON DELETE SET NULL,  -- default site, optional
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    opening_date DATE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    remarks      TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;

  -- Which cash box the money moved through. NULL = not assigned to an imprest,
  -- which is what every historical row stays until a cutover is agreed.
  ALTER TABLE public.cash_book
    ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL;

  -- Both legs of one internal transfer share this, so a half-deleted transfer
  -- is detectable instead of silently unbalancing the book.
  ALTER TABLE public.cash_book
    ADD COLUMN IF NOT EXISTS transfer_group_id UUID;

  CREATE INDEX IF NOT EXISTS idx_cash_book_cash_account ON public.cash_book(cash_account_id);
  CREATE INDEX IF NOT EXISTS idx_cash_book_transfer_group ON public.cash_book(transfer_group_id);
END
$$;

-- Policies: read for anyone signed in (balances appear on reports), write for
-- the roles that already write the money tables. Same rule as migration 1143.
DO $$
BEGIN
  DROP POLICY IF EXISTS "cash_accounts_read" ON public.cash_accounts;
  CREATE POLICY "cash_accounts_read" ON public.cash_accounts FOR SELECT
    USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "cash_accounts_write" ON public.cash_accounts;
  CREATE POLICY "cash_accounts_write" ON public.cash_accounts FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.id = (SELECT auth.uid()) AND p.is_active
                     AND p.role IN ('admin','accounts','site_manager','site_incharge')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.id = (SELECT auth.uid()) AND p.is_active
                     AND p.role IN ('admin','accounts','site_manager','site_incharge')));
END
$$;

-- The four accounts, and the running-balance view.
DO $$
BEGIN
  INSERT INTO public.cash_accounts (name, acct_type, sort_order) VALUES
    ('HO Imprest',                   'ho_imprest',     1),
    ('Mandal Imprest',               'mandal_imprest', 2),
    ('Dendi Naraendra Reddy Imprest','person',         3),
    ('Dendi Srinath Reddy Imprest',  'person',         4)
  ON CONFLICT (name) DO NOTHING;

  DROP VIEW IF EXISTS public.v_cash_account_balance;
  CREATE VIEW public.v_cash_account_balance AS
  SELECT a.id AS cash_account_id, a.name, a.acct_type, a.is_active, a.sort_order,
         a.opening_balance, a.opening_date,
         COALESCE(t.in_amt, 0)  AS total_in,
         COALESCE(t.out_amt, 0) AS total_out,
         COALESCE(t.txns, 0)    AS txn_count,
         a.opening_balance + COALESCE(t.in_amt,0) - COALESCE(t.out_amt,0) AS balance
  FROM public.cash_accounts a
  LEFT JOIN (
    SELECT cash_account_id,
           sum(COALESCE(amount_in,0))  AS in_amt,
           sum(COALESCE(amount_out,0)) AS out_amt,
           count(*)                    AS txns
    FROM public.cash_book
    WHERE cash_account_id IS NOT NULL
    GROUP BY cash_account_id
  ) t ON t.cash_account_id = a.id;
END
$$;

-- VERIFY 1: the four accounts exist, the two columns exist, and the view works.
SELECT (SELECT count(*)::int FROM public.cash_accounts) AS accounts,
       (SELECT string_agg(name || '=' || acct_type, ' | ' ORDER BY sort_order)
        FROM public.cash_accounts) AS account_list,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='cash_book'
          AND column_name IN ('cash_account_id','transfer_group_id')) AS new_columns,
       (SELECT count(*)::int FROM public.v_cash_account_balance) AS balance_rows,
       (SELECT count(*)::int FROM public.cash_accounts a
        JOIN public.v_cash_account_balance b ON b.cash_account_id = a.id
        WHERE b.balance <> 0) AS accounts_with_nonzero_balance;

-- VERIFY 2: nothing existing moved. Every cash_book row keeps its farm_id and
-- is still unassigned to an imprest, and the book's net balance is unchanged.
SELECT (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows,
       (SELECT count(*)::int FROM public.cash_book WHERE cash_account_id IS NULL) AS unassigned_rows,
       (SELECT count(*)::int FROM public.cash_book WHERE farm_id IS NOT NULL) AS rows_with_site,
       (SELECT round(sum(COALESCE(amount_in,0)) - sum(COALESCE(amount_out,0)), 2)
        FROM public.cash_book) AS net_balance,
       (SELECT count(*)::int FROM pg_policies
        WHERE schemaname='public' AND tablename='cash_accounts') AS cash_account_policies;
