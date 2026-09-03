-- Migration 1152: make cross-book transfers possible and imprest balances
-- cash-only.
--
-- TWO THINGS, both agreed with the owner.
--
-- (1) TRANSFER PAIRING ACROSS BOOKS. An imprest-to-bank deposit needs one leg
--     in cash_book and one in bank_transactions. cash_book already has
--     transfer_group_id (migration 1150); bank_transactions does not, so today
--     a cross-book transfer could be half-deleted and silently unbalance both
--     books. Adding the same column to the bank side lets the two legs be found
--     as one movement.
--
-- (2) IMPREST BALANCES COUNT CASH ONLY. An imprest is physical cash the holder
--     carries; a cheque or UPI payment moves through the bank, not the tin.
--     v_cash_account_balance counted every tagged row regardless of mode, so a
--     UPI payment tagged to Srinath would have reduced the cash he is holding
--     when it never touched it. Now only payment_mode = 'cash' counts, and a
--     non-cash count is exposed so the ledger can show those rows and say
--     plainly that they are excluded rather than dropping them silently.
--
-- Views are DROPped before recreating -- CREATE OR REPLACE fails silently when
-- column names or order change.

DO $$
BEGIN
  ALTER TABLE public.bank_transactions
    ADD COLUMN IF NOT EXISTS transfer_group_id UUID;
  CREATE INDEX IF NOT EXISTS idx_bank_txn_transfer_group
    ON public.bank_transactions(transfer_group_id);

  -- Which imprest a bank leg moved to or from, so a deposit can name its
  -- source without reading the other leg.
  ALTER TABLE public.bank_transactions
    ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL;
END
$$;

DO $$
BEGIN
  DROP VIEW IF EXISTS public.v_cash_account_balance;
  CREATE VIEW public.v_cash_account_balance AS
  SELECT a.id AS cash_account_id, a.name, a.acct_type, a.is_active, a.sort_order,
         a.opening_balance, a.opening_date,
         COALESCE(t.in_amt, 0)  AS total_in,
         COALESCE(t.out_amt, 0) AS total_out,
         COALESCE(t.txns, 0)    AS txn_count,
         -- Tagged to this imprest but paid by cheque or UPI: shown on the
         -- ledger, excluded from the balance, never silently dropped.
         COALESCE(t.non_cash_txns, 0) AS non_cash_txn_count,
         a.opening_balance + COALESCE(t.in_amt,0) - COALESCE(t.out_amt,0) AS balance
  FROM public.cash_accounts a
  LEFT JOIN (
    SELECT cash_account_id,
           sum(COALESCE(amount_in,0))  FILTER (WHERE COALESCE(payment_mode,'cash') = 'cash') AS in_amt,
           sum(COALESCE(amount_out,0)) FILTER (WHERE COALESCE(payment_mode,'cash') = 'cash') AS out_amt,
           count(*)                                                                          AS txns,
           count(*) FILTER (WHERE COALESCE(payment_mode,'cash') <> 'cash')                   AS non_cash_txns
    FROM public.cash_book
    WHERE cash_account_id IS NOT NULL
    GROUP BY cash_account_id
  ) t ON t.cash_account_id = a.id;
END
$$;

-- VERIFY 1: the bank side has both new columns and the index.
SELECT (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='bank_transactions'
          AND column_name IN ('transfer_group_id','cash_account_id')) AS bank_new_columns,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='cash_book'
          AND column_name IN ('transfer_group_id','cash_account_id')) AS cash_new_columns,
       (SELECT count(*)::int FROM pg_indexes
        WHERE schemaname='public' AND indexname='idx_bank_txn_transfer_group') AS bank_index;

-- VERIFY 2: the view rebuilt with the new column, still returns all four
-- accounts, and nothing in either book moved.
SELECT (SELECT count(*)::int FROM public.v_cash_account_balance) AS balance_rows,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='v_cash_account_balance'
          AND column_name='non_cash_txn_count') AS has_non_cash_column,
       (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows,
       (SELECT count(*)::int FROM public.bank_transactions) AS bank_txn_rows,
       (SELECT round(sum(COALESCE(amount_in,0)) - sum(COALESCE(amount_out,0)), 2)
        FROM public.cash_book) AS cash_book_net,
       (SELECT count(*)::int FROM public.cash_book WHERE cash_account_id IS NOT NULL) AS rows_tagged;
