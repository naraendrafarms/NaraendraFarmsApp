-- READ ONLY. Everything the FY25-26 statement import needs to know first.
-- Guessing any of this would reject the whole insert, or worse, put 957 rows
-- on the wrong account.

SELECT COALESCE(string_agg(bank_name || '/' || COALESCE(account_name,'-') || '[' || left(id::text,8) || ']'
       || CASE WHEN is_active THEN '' ELSE ' INACTIVE' END, ' ~ ' ORDER BY bank_name), 'none') AS bank_accounts
  FROM public.bank_accounts;

-- Is ANY of FY25-26 already in the ledger? If this is not 0, the statement
-- would be imported on top of rows that already exist.
SELECT 'existingFY2526=' || COUNT(*)
    || ' credits=' || COUNT(*) FILTER (WHERE txn_type='Credit')
    || ' debits=' || COUNT(*) FILTER (WHERE txn_type='Debit')
    || ' earliestOverall=' || COALESCE(MIN(txn_date)::text,'-')
    AS pre_existing_rows
  FROM public.bank_transactions
 WHERE txn_date BETWEEN '2025-04-01' AND '2026-03-31';

-- Any constraint on category added after the table was created?
SELECT COALESCE(string_agg(conname || '=' || left(pg_get_constraintdef(oid), 90), ' ~ '), 'none') AS bank_txn_constraints
  FROM pg_constraint
 WHERE conrelid = 'public.bank_transactions'::regclass AND contype = 'c';

-- Exact party ids to attach the Hitech and Jamal credits to.
SELECT COALESCE(string_agg(name || '=' || id::text, ' ~ ' ORDER BY name), 'none') AS party_ids
  FROM public.parties
 WHERE name ILIKE 'Hitech Hatch Fresh Private Limited'
    OR name ILIKE 'Jamal Agro Industries Private Limited';

-- Which categories the ledger already uses, so imported rows match the house
-- vocabulary rather than inventing new words.
SELECT COALESCE(string_agg(x.c, ' ~ ' ORDER BY x.n DESC), 'none') AS categories_in_use
  FROM ( SELECT COALESCE(category,'(null)') AS c, COUNT(*) AS n
           FROM public.bank_transactions GROUP BY 1 ORDER BY 2 DESC LIMIT 12 ) x;
