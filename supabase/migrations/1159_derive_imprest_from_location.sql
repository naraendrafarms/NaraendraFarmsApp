-- Migration 1159: the imprest is DERIVED from where the cash is, not tagged.
--
-- THE OWNER'S POINT, and he is right: cash_book already records the location.
-- With exactly one imprest per site, a receipt at Agraharam can only be held by
-- the Agraharam Site Imprest. Asking anyone to tag 138 receipts to record
-- something already derivable is busywork, and a second way of saying what the
-- location already says.
--
-- WHERE THE LOCATION IS NOT ENOUGH: cash at Head Office could be held by HO
-- Imprest, Mandal Imprest, or either person -- four possibilities the location
-- cannot separate. And once cash moves site -> Mandal -> a person, the HOLDER
-- changes while the location does not.
--
-- SO THE RULE, confirmed by the owner:
--   1. cash_account_id set explicitly  -> that account wins, always
--   2. otherwise, row has a site       -> that site's imprest
--   3. otherwise (no site = Head Office) -> HO Imprest
--
-- NOTHING IS WRITTEN TO ANY ROW. The owner asked to keep the vouchers as they
-- are; this only changes how they are READ. Any row can still be tagged
-- explicitly later and that tag will override the derivation.
--
-- Cash only, as before: an imprest is physical cash, so cheque and UPI rows are
-- excluded from the balance and merely listed.
--
-- v_imprest_entries is the single definition of "which imprest does this row
-- belong to". The balance view and the Imprest Ledger both read it, so the
-- ledger can never show a different set of rows than the balance counts.

DO $$
BEGIN
  DROP VIEW IF EXISTS public.v_cash_account_balance;
  DROP VIEW IF EXISTS public.v_imprest_entries;

  CREATE VIEW public.v_imprest_entries AS
  SELECT cb.id AS cash_book_id,
         cb.txn_date, cb.txn_type, cb.category, cb.description, cb.party_name,
         cb.reference_no, cb.amount_in, cb.amount_out, cb.payment_mode,
         cb.farm_id, cb.flock_id, cb.nhe_sale_id, cb.he_dispatch_id,
         cb.cash_account_id AS tagged_account_id,
         COALESCE(
           cb.cash_account_id,
           site_a.id,
           CASE WHEN cb.farm_id IS NULL THEN ho_a.id END
         ) AS cash_account_id,
         (cb.cash_account_id IS NULL) AS derived,
         (COALESCE(cb.payment_mode, 'cash') = 'cash') AS counts_to_balance
  FROM public.cash_book cb
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

-- The duplicate site column. cash_book already carries where the cash was
-- received, set on the sales form as "Cash Received At"; nhe_sales.farm_id was
-- added by 1155, written by nothing, and backfilled from the flock's laying
-- farm -- a guess competing with a fact. Dropped at the owner's instruction.
-- nhe_sales.cash_account_id, also from 1155 and also unused, is left in place
-- rather than dropped without being asked.
ALTER TABLE public.nhe_sales DROP COLUMN IF EXISTS farm_id;

-- VERIFY 1: every account's balance now, and how many of its entries are
-- derived rather than tagged. Nothing should be zero that has cash at its site.
SELECT string_agg(name || ': Rs ' || round(balance) || ' (' || txn_count || ' entries, '
                  || derived_txn_count || ' derived)', ' | ' ORDER BY sort_order) AS balances
FROM public.v_cash_account_balance;

-- VERIFY 2: no cash row is left without a home, the duplicate column is gone,
-- and not a single cash_book row was written to.
SELECT (SELECT count(*)::int FROM public.v_imprest_entries WHERE cash_account_id IS NULL) AS rows_with_no_imprest,
       (SELECT count(*)::int FROM public.v_imprest_entries) AS total_rows,
       (SELECT count(*)::int FROM public.v_imprest_entries WHERE derived) AS derived_rows,
       (SELECT count(*)::int FROM public.cash_book WHERE cash_account_id IS NOT NULL) AS still_explicitly_tagged,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='nhe_sales' AND column_name='farm_id') AS duplicate_column_gone_if_zero,
       (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows;
