-- Migration 1184: a site with no imprest of its own falls back to HO Imprest.
--
-- OPTION (b), chosen by the owner. Rule 3 of the derivation added in 1159 read
-- "HO Imprest, but ONLY when farm_id IS NULL". Head Office is a real farm row,
-- and Farm Expenses writes that farm's id rather than NULL, so its rows matched
-- neither rule 2 (no site_petty account exists for it) nor rule 3 (farm_id is
-- not null) and belonged to no cash box at all -- 134 entries, about Rs 3.7
-- lakh, visible only under "Not assigned to any imprest".
--
-- The rule becomes simply: explicit tag, else the site's own imprest, else HO
-- Imprest. Any site without an imprest of its own now lands on HO Imprest,
-- which is where that cash conceptually sits.
--
-- The Feed Mill is unaffected: migration 1182 gave it its own imprest, so
-- rule 2 catches it before this fallback is reached.
--
-- STILL NOTHING IS WRITTEN TO ANY ROW. This changes only how rows are READ, and
-- an explicit cash_account_id continues to beat both fallbacks.
--
-- Both views are dropped and recreated rather than replaced: CREATE OR REPLACE
-- VIEW fails silently when column names or order change.

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
         -- A row with no farm is Head Office, which is what the cash book has
         -- always meant by blank. Kept exactly as 1160 defined it.
         COALESCE(f.name, 'Head Office') AS farm_name,
         cb.flock_id, cb.nhe_sale_id, cb.he_dispatch_id,
         cb.cash_account_id AS tagged_account_id,
         -- THE ONLY CHANGE: the third fallback no longer requires farm_id to be
         -- NULL, so a site with no imprest of its own lands on HO Imprest.
         COALESCE(cb.cash_account_id, site_a.id, ho_a.id) AS cash_account_id,
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

-- VERIFY 1: nothing is unassigned any more, and no cash_book row was written to.
SELECT (SELECT count(*)::int FROM public.v_imprest_entries WHERE cash_account_id IS NULL) AS still_unassigned,
       (SELECT count(*)::int FROM public.v_imprest_entries) AS total_rows,
       (SELECT count(*)::int FROM public.cash_book WHERE cash_account_id IS NOT NULL) AS still_explicitly_tagged;

-- VERIFY 2: every balance now, so the shift onto HO Imprest is visible rather
-- than assumed. The Imprest Ledger reads these same figures.
SELECT string_agg(name || ': Rs ' || round(balance) || ' (' || txn_count || ')', ' | ' ORDER BY sort_order, name) AS balances
FROM public.v_cash_account_balance WHERE is_active;

-- VERIFY 3: the columns the Imprest Ledger selects still exist on the view --
-- farm_name and created_at were added by 1160 and must survive the rebuild, or
-- the whole request fails and the ledger silently shows nothing.
SELECT count(*)::int AS ledger_columns_present
FROM information_schema.columns
WHERE table_schema='public' AND table_name='v_imprest_entries'
  AND column_name IN ('farm_name','created_at','cash_book_id','counts_to_balance','derived');
