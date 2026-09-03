-- Migration 1160: v_imprest_entries gains farm_name and created_at.
--
-- THE BUG: the Imprest Ledger showed NO vouchers at all for any account, at any
-- date range. 1159 pointed the ledger at v_imprest_entries, and the query kept
-- two things that only work against a table:
--   farms(name)        -- a PostgREST embed. A view has no foreign keys, so the
--                         relationship cannot be resolved and the request fails.
--   .order('created_at') -- a column the view never selected.
-- Either one alone fails the whole request, so the list came back empty while
-- the balance cards - which read a different view - looked fine. That mismatch
-- is exactly what made it look like the vouchers had vanished.
--
-- The fix is to give the view the columns the screen needs, so it can be read
-- as a flat result with no embedding: farm_name resolved here, and created_at
-- carried through for a stable order within a date.
--
-- Still no writes: this only changes how existing rows are read.

DO $$
BEGIN
  DROP VIEW IF EXISTS public.v_cash_account_balance;
  DROP VIEW IF EXISTS public.v_imprest_entries;

  CREATE VIEW public.v_imprest_entries AS
  SELECT cb.id AS cash_book_id,
         cb.txn_date, cb.created_at,
         cb.txn_type, cb.category, cb.description, cb.party_name,
         cb.reference_no, cb.amount_in, cb.amount_out, cb.payment_mode,
         cb.farm_id,
         -- Resolved here so the screen needs no embed. A row with no farm is
         -- Head Office, which is what the cash book has always meant by blank.
         COALESCE(f.name, 'Head Office') AS farm_name,
         cb.flock_id, cb.nhe_sale_id, cb.he_dispatch_id,
         cb.cash_account_id AS tagged_account_id,
         COALESCE(
           cb.cash_account_id,
           site_a.id,
           CASE WHEN cb.farm_id IS NULL THEN ho_a.id END
         ) AS cash_account_id,
         (cb.cash_account_id IS NULL) AS derived,
         (COALESCE(cb.payment_mode, 'cash') = 'cash') AS counts_to_balance
  FROM public.cash_book cb
  LEFT JOIN public.farms f ON f.id = cb.farm_id
  LEFT JOIN public.cash_accounts site_a
         ON site_a.farm_id = cb.farm_id
        AND site_a.acct_type = 'site_petty'
        AND site_a.is_active
  LEFT JOIN LATERAL (
    SELECT a.id FROM public.cash_accounts a
    WHERE a.acct_type = 'ho_imprest' AND a.is_active
    ORDER BY a.sort_order LIMIT 1
  ) ho_a ON TRUE;

  CREATE VIEW public.v_cash_account_balance AS
  SELECT a.id AS cash_account_id, a.name, a.acct_type, a.is_active, a.sort_order,
         a.opening_balance, a.opening_date,
         COALESCE(t.in_amt, 0)  AS total_in,
         COALESCE(t.out_amt, 0) AS total_out,
         COALESCE(t.txns, 0)    AS txn_count,
         COALESCE(t.non_cash_txns, 0) AS non_cash_txn_count,
         COALESCE(t.derived_txns, 0)  AS derived_txn_count,
         a.opening_balance + COALESCE(t.in_amt,0) - COALESCE(t.out_amt,0) AS balance
  FROM public.cash_accounts a
  LEFT JOIN (
    SELECT e.cash_account_id,
           sum(COALESCE(e.amount_in,0))  FILTER (WHERE e.counts_to_balance) AS in_amt,
           sum(COALESCE(e.amount_out,0)) FILTER (WHERE e.counts_to_balance) AS out_amt,
           count(*)                                        AS txns,
           count(*) FILTER (WHERE NOT e.counts_to_balance) AS non_cash_txns,
           count(*) FILTER (WHERE e.derived)               AS derived_txns
    FROM public.v_imprest_entries e
    WHERE e.cash_account_id IS NOT NULL
    GROUP BY e.cash_account_id
  ) t ON t.cash_account_id = a.id;
END
$$;

-- VERIFY 1: the columns the screen asks for now exist on the view.
SELECT string_agg(column_name, ', ' ORDER BY column_name) AS needed_columns_present
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'v_imprest_entries'
  AND column_name IN ('cash_book_id','txn_date','created_at','farm_name','cash_account_id','derived');

-- VERIFY 2: the ledger will actually return rows -- entries per account, which
-- is the thing that was showing as zero on screen.
SELECT string_agg(t.txt, ' | ' ORDER BY t.nm) AS entries_per_account
FROM (
  SELECT a.name AS nm, a.name || ': ' || count(e.cash_book_id) AS txt
  FROM public.cash_accounts a
  LEFT JOIN public.v_imprest_entries e ON e.cash_account_id = a.id
  GROUP BY a.name
) t;
