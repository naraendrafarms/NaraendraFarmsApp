-- Migration 1186: the 46 Mandal Imprest rows move to their own site's imprest.
--
-- OWNER'S INSTRUCTION, after seeing the measured effect in 1185: route them by
-- site. Negative balances are accepted -- the funding transfers into those tins
-- will be entered separately.
--
-- HOW, and why this way: every one of the 46 rows carries an EXPLICIT
-- cash_account_id pointing at Mandal, and an explicit tag beats every fallback.
-- Clearing that tag hands the row back to the derivation, which then sends it
-- to the site's own imprest (rule 2) or, for the two Head Office rows that have
-- no site imprest, to HO Imprest (rule 3, made a universal fallback by 1184).
-- Setting each site's id by hand would work too, but would re-freeze the rows
-- against a site that could later change; clearing keeps them following the
-- site they actually carry.
--
-- cash_book.farm_id -- WHICH SITE BEARS THE COST -- is not touched, so no cost
-- report, P&L or site expense figure changes by a rupee. Only WHICH TIN THE
-- CASH LEFT is being corrected.
--
-- REVERSIBLE ON PURPOSE: the old tagging is copied to a backup table first, so
-- this can be undone exactly if the owner disagrees after checking. The table
-- is kept rather than dropped at the end.

-- [1] Keep the original tagging before changing it.
CREATE TABLE IF NOT EXISTS public.cash_book_mandal_retag_1186 AS
SELECT cb.id AS cash_book_id, cb.cash_account_id AS old_cash_account_id, now() AS backed_up_at
FROM public.cash_book cb
JOIN public.cash_accounts a ON a.id = cb.cash_account_id
WHERE a.name = 'Mandal Imprest';

-- [2] Hand the rows back to the derivation.
UPDATE public.cash_book cb
SET cash_account_id = NULL
FROM public.cash_book_mandal_retag_1186 b
WHERE cb.id = b.cash_book_id AND cb.cash_account_id IS NOT NULL;

-- [3] VERIFY: everything backed up, nothing left tagged to Mandal, and the same
-- number of rows now derive instead.
SELECT (SELECT count(*)::int FROM public.cash_book_mandal_retag_1186) AS backed_up,
       (SELECT count(*)::int FROM public.cash_book cb
        JOIN public.cash_accounts a ON a.id = cb.cash_account_id
        WHERE a.name = 'Mandal Imprest') AS still_tagged_to_mandal,
       (SELECT count(*)::int FROM public.v_imprest_entries e
        JOIN public.cash_book_mandal_retag_1186 b ON b.cash_book_id = e.cash_book_id
        WHERE e.derived) AS now_derived,
       (SELECT count(*)::int FROM public.v_imprest_entries WHERE cash_account_id IS NULL) AS unassigned;

-- [4] VERIFY: the balances, to be compared against what 1185 predicted --
-- Mandal 110319, Agraharam 3155018, Bpet-1 61659, Bpet-2 -16016,
-- Feed Mill 28166, HO 890998, Kethireddypally -240181.
SELECT string_agg(name || ': ' || round(balance), ' | ' ORDER BY sort_order, name) AS balances_after
FROM public.v_cash_account_balance WHERE is_active;

-- [5] VERIFY: not a single cash_book row was added, removed or had its SITE
-- changed -- only the imprest tag moved.
SELECT (SELECT count(*)::int FROM public.cash_book) AS cash_book_rows,
       (SELECT count(*)::int FROM public.v_imprest_entries) AS imprest_rows,
       (SELECT round(sum(COALESCE(amount_out,0)))::numeric FROM public.cash_book) AS total_paid_out,
       (SELECT count(*)::int FROM public.cash_book cb
        JOIN public.cash_book_mandal_retag_1186 b ON b.cash_book_id = cb.id
        WHERE cb.farm_id IS NOT NULL) AS moved_rows_still_carrying_their_site;
