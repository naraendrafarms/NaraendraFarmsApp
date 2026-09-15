-- Read-only. The owner reports that Accounts -> Pending Payments offers the
-- three BANK accounts when paying a bill but no imprest, although some bills are
-- paid out of a site's cash tin.
--
-- What the code does, confirmed before running this: the "Paid From Bank
-- Account" box is shown only for non-cash modes (needsBankAccount excludes
-- cash, advance and opening adjustment) and lists bank_accounts. Choose Cash and
-- the box simply disappears - nothing replaces it. postLedgerEntry then writes
-- the cash_book row with NEITHER cash_account_id NOR farm_id. The imprest
-- derivation is COALESCE(cash_account_id, site imprest, HO Imprest), so with
-- both blank every cash bill payment lands on HO IMPREST whatever tin really
-- paid it. This measures how much is sitting there.
SELECT 1 AS warmup;

-- 1. The accounts on offer: three banks, and the imprest tins that are not offered
SELECT (SELECT count(*) FROM public.bank_accounts)::int AS bank_accounts,
       (SELECT count(*) FROM public.cash_accounts WHERE is_active)::int AS active_cash_accounts,
       (SELECT count(*) FROM public.cash_accounts WHERE is_active AND acct_type = 'site_petty')::int AS site_imprests,
       (SELECT count(*) FROM public.cash_accounts WHERE is_active AND acct_type = 'ho_imprest')::int AS ho_imprests,
       (SELECT COALESCE(string_agg(name, ' | ' ORDER BY sort_order, name), '-')
        FROM public.cash_accounts WHERE is_active)::text AS the_tins;

-- 2. Every cash_book row that came from a bill payment, by mode, and how many
--    carry a tin or a site of their own
SELECT COALESCE(cb.payment_mode, '(none)') AS payment_mode,
       count(*)::int AS rows,
       sum(cb.amount_out)::numeric AS amount_out,
       count(*) FILTER (WHERE cb.cash_account_id IS NOT NULL)::int AS has_a_tin,
       count(*) FILTER (WHERE cb.farm_id IS NOT NULL)::int AS has_a_site,
       count(*) FILTER (WHERE cb.cash_account_id IS NULL AND cb.farm_id IS NULL)::int AS neither
FROM public.cash_book cb
WHERE cb.pending_payment_id IS NOT NULL
GROUP BY 1 ORDER BY 3 DESC NULLS LAST;

-- 3. The cash ones specifically: what the derivation does with them
SELECT ca.name AS lands_in_this_imprest,
       count(*)::int AS rows,
       sum(v.amount_out)::numeric AS amount_out,
       count(*) FILTER (WHERE v.derived)::int AS derived_not_tagged,
       min(v.txn_date)::text AS oldest, max(v.txn_date)::text AS newest
FROM public.v_imprest_entries v
JOIN public.cash_book cb ON cb.id = v.cash_book_id
LEFT JOIN public.cash_accounts ca ON ca.id = v.cash_account_id
WHERE cb.pending_payment_id IS NOT NULL
  AND COALESCE(cb.payment_mode, 'cash') = 'cash'
GROUP BY 1 ORDER BY 3 DESC NULLS LAST;

-- 4. Is this only bill payments, or does every cash_book writer have the same
--    hole? Rows with no tin AND no site, by category - the ones that all pile
--    into HO Imprest by default.
SELECT COALESCE(cb.category, '(none)') AS category,
       count(*)::int AS rows_with_no_tin_and_no_site,
       sum(cb.amount_out)::numeric AS out_amount,
       sum(cb.amount_in)::numeric AS in_amount
FROM public.cash_book cb
WHERE cb.cash_account_id IS NULL AND cb.farm_id IS NULL
  AND COALESCE(cb.payment_mode, 'cash') = 'cash'
GROUP BY 1 ORDER BY 2 DESC LIMIT 20;
