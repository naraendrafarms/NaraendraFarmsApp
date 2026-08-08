-- Diagnostic only (no schema changes).
--
-- The statutory challans are paid from "our partner bank account Hitech".
-- 591 listed the partners and none of them is Hitech (Amit Das, Dendi
-- Naraendra Reddy, Gottipati Parmita Das, Radheshyam Roy, Ranu Halder,
-- Sumit Das), so before building a partner current-account page that expects
-- Hitech to be selectable, find out what Hitech actually IS in this database:
-- a partner, a supplier/customer party, a bank account, a farm/site, or not
-- recorded at all.

SELECT COALESCE(string_agg('partner: ' || name, ', '), 'none') AS partners_matching
FROM public.partners WHERE name ILIKE '%hitech%' OR name ILIKE '%hi tech%';

SELECT COALESCE(string_agg('party: ' || name || ' (' || COALESCE(type,'?') || ')', ', '), 'none') AS parties_matching
FROM public.parties WHERE name ILIKE '%hitech%' OR name ILIKE '%hi tech%';

SELECT COALESCE(string_agg('bank: ' || COALESCE(account_name,'?') || ' / ' || COALESCE(bank_name,'?'), ', '), 'none') AS bank_accounts_matching
FROM public.bank_accounts WHERE account_name ILIKE '%hitech%' OR bank_name ILIKE '%hitech%';

-- And the full bank account list, since the transfers must come from one of
-- these and it may be named differently from the partner.
SELECT COALESCE(string_agg(COALESCE(account_name,'?') || ' [' || COALESCE(bank_name,'?') || ']', ' | ' ORDER BY account_name), 'NONE') AS all_bank_accounts
FROM public.bank_accounts;
