-- Migration 1182: the Feed Mill gets its own site imprest.
--
-- WHY IT WAS MISSING: migration 1155 seeded a site imprest only for farms whose
-- site_type is 'rearing' or 'laying', deliberately skipping the Feed Mill and
-- Head Office. The Feed Mill does hold and spend cash, so measuring on
-- 04/09/2026 found 6 farm expenses worth Rs 10,139 belonging to no imprest at
-- all -- visible on the Imprest Ledger only under "Not assigned to any imprest"
-- and counted in no balance.
--
-- Created at the owner's instruction. Named and shaped exactly like the site
-- imprests 1155 created, so the derivation in 1159 picks it up with no code
-- change: rule 2 matches a site_petty account on the row's farm_id.
--
-- NO OPENING BALANCE IS SET, matching every other account -- 1150 left them all
-- at zero on purpose, because inventing one puts a false figure on a real cash
-- box. The account will therefore read NEGATIVE by its expenses until the owner
-- enters the real opening balance and date on
-- Masters -> Cash Imprest Accounts, exactly as Kethireddypally did.
--
-- Targeted by site_type rather than by name or id, so it cannot create an
-- account against the wrong farm, and ON CONFLICT so re-running is harmless.
-- Head Office is NOT touched: it was not asked for and remains unassigned.

INSERT INTO public.cash_accounts (name, acct_type, farm_id, sort_order)
SELECT f.name || ' Site Imprest', 'site_petty', f.id, 10
FROM public.farms f
WHERE COALESCE(f.site_type, 'laying') = 'feedmill'
ON CONFLICT (name) DO NOTHING;

-- VERIFY 1: the account exists, against the right farm, with no invented balance.
SELECT a.name, a.acct_type, a.opening_balance, f.name AS farm, f.site_type
FROM public.cash_accounts a
JOIN public.farms f ON f.id = a.farm_id
WHERE COALESCE(f.site_type,'') = 'feedmill';

-- VERIFY 2: what it now holds, and what is still unassigned. The Feed Mill rows
-- should have moved out of the unassigned bucket; Head Office should not have.
SELECT (SELECT count(*)::int FROM public.v_imprest_entries WHERE cash_account_id IS NULL) AS still_unassigned,
       (SELECT round(COALESCE(sum(COALESCE(amount_out,0) - COALESCE(amount_in,0)),0))::numeric
        FROM public.v_imprest_entries WHERE cash_account_id IS NULL) AS unassigned_net_out,
       (SELECT count(*)::int FROM public.v_imprest_entries e
        JOIN public.cash_accounts a ON a.id = e.cash_account_id
        JOIN public.farms f ON f.id = a.farm_id
        WHERE COALESCE(f.site_type,'') = 'feedmill') AS rows_now_on_feed_mill;

-- VERIFY 3: the Feed Mill balance as the Imprest Ledger will show it, so the
-- negative figure below is expected rather than alarming.
SELECT name, txn_count, round(total_in)::numeric AS cash_in,
       round(total_out)::numeric AS cash_out, round(balance)::numeric AS balance
FROM public.v_cash_account_balance
WHERE name ILIKE '%Feed Mill%';
