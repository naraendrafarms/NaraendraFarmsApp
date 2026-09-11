-- A salary paid to an employee's bank and then RETURNED by them needs recording
-- as what it is: the original Debit really happened and is on the statement, and
-- so did the Credit that brought it back. Until now the only way to show the
-- Credit was a manual Bank Ledger entry under "Other", with nothing but the
-- typed description tying it to the salary it reverses.
--
-- WHY A NEW COLUMN AND NOT salary_monthly_id, WHICH ALREADY EXISTS:
-- bank_transactions.salary_monthly_id (migration 321) carries the Debit that the
-- salary form creates when a salary is marked Paid. That form re-syncs itself
-- with an unconditional
--     delete from bank_transactions where salary_monthly_id = <this salary>
-- and it does that in EIGHT places - on save, on edit, on revert to Pending, on
-- delete, in the ESI/PF editor and in Bulk Salary. A return Credit hung on the
-- same column would be destroyed by any later edit of that salary, silently, and
-- the bank balance would then read high by the returned amount with nothing on
-- screen to say why. A column of its own cannot be caught by those deletes, and
-- needs no change to the payment path at all.
--
-- ON DELETE SET NULL, not CASCADE: if the salary row is ever deleted the money
-- still came back into the bank and the Credit must survive, merely unlinked.
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS salary_return_for UUID REFERENCES public.salary_monthly(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_txn_salary_return
  ON public.bank_transactions (salary_return_for) WHERE salary_return_for IS NOT NULL;

NOTIFY pgrst, 'reload schema';

-- VERIFY: the column and its foreign key both exist. run_sql.py reports an
-- "already exists" error as success, so a silent failure would look identical
-- to a clean run and the app would then save returns that never linked.
SELECT c.column_name, c.data_type, c.is_nullable,
       (SELECT count(*)::int FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage k ON k.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'bank_transactions' AND tc.constraint_type = 'FOREIGN KEY'
          AND k.column_name = 'salary_return_for') AS foreign_keys,
       (SELECT count(*)::int FROM pg_indexes
        WHERE tablename = 'bank_transactions' AND indexname = 'idx_bank_txn_salary_return') AS indexes
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name = 'bank_transactions'
  AND c.column_name = 'salary_return_for';

-- VERIFY: nothing existing was touched, and the new column starts empty.
SELECT count(*)::int AS bank_transactions,
       count(*) FILTER (WHERE salary_return_for IS NOT NULL)::int AS returns_linked,
       count(*) FILTER (WHERE salary_monthly_id IS NOT NULL)::int AS salary_debits_still_linked
FROM public.bank_transactions;
