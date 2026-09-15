-- Paying a bill in CASH from Accounts -> Pending Payments had nowhere to say
-- WHICH cash tin the money came out of. The "Paid From Bank Account" box is
-- shown only for non-cash modes, and choosing Cash simply removed it with
-- nothing in its place, so postLedgerEntry wrote the cash_book row with neither
-- cash_account_id nor farm_id. The imprest derivation is
--     COALESCE(cash_account_id, the site's own imprest, HO Imprest)
-- so with both blank EVERY cash bill payment landed in HO Imprest, whatever
-- tin really paid it - the site imprests never saw the spend and HO Imprest
-- carried spending it never did. Same fault as the NHE sales Head Office one.
--
-- The bill already records WHICH BANK paid it (bank_account_id, one of three).
-- This is the same fact for cash, kept the same way, so the Pay modal, Bulk Pay
-- and the edit form can all show back what was chosen instead of guessing.
--
-- ON DELETE SET NULL: retiring a tin must never delete a bill.
-- NOTHING IS WRITTEN TO ANY EXISTING ROW. Bills already paid in cash keep a
-- blank tin and go on deriving to HO Imprest exactly as they do today - moving
-- them is a separate decision for the owner, not a side effect of this column.
ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';

-- VERIFY: the column and its foreign key exist. run_sql.py reports an
-- "already exists" error as success, so without this a silent failure would
-- look identical to a clean run - and the app would then send a column that is
-- not there, which PostgREST rejects, failing the WHOLE bill update.
SELECT c.column_name, c.data_type, c.is_nullable,
       (SELECT count(*)::int FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage k ON k.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'pending_payments' AND tc.constraint_type = 'FOREIGN KEY'
          AND k.column_name = 'cash_account_id') AS foreign_keys
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name = 'pending_payments'
  AND c.column_name = 'cash_account_id';

-- VERIFY: nothing existing moved, and this is the size of what is still
-- sitting in HO Imprest by default - the owner's separate decision.
SELECT count(*)::int AS bills,
       count(*) FILTER (WHERE cash_account_id IS NOT NULL)::int AS with_a_tin,
       count(*) FILTER (WHERE lower(COALESCE(account_type,'')) = 'cash')::int AS paid_in_cash,
       COALESCE(sum(paid_amount) FILTER (WHERE lower(COALESCE(account_type,'')) = 'cash'), 0)::numeric AS cash_paid_amount
FROM public.pending_payments;
