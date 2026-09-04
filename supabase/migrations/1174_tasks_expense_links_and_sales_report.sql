-- Migration 1174: record what 1171/1172/1173 found, and the sales report asked
-- for, as development tasks rather than leaving them in the chat.
--
-- Measured, not assumed: 417 farm expenses, Apr-Aug 2026, Rs 18,24,400.
-- Cross-tab from 1173: both flock and imprest 0, flock only 4, imprest only 273,
-- neither 140.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Farm expenses reach no flock, so Financial and Cost & Income understate cost',
   'OPEN - WAITING ON YOUR DECISION. Measured 04/09/2026 by migrations 1172 and 1173. Of 417 farm expenses '
   || '(02/04/2026 to 19/08/2026, Rs 18,24,400), only 4 carry a flock_id - all four on Flock 23, Kethireddypally, '
   || 'August 2026, Rs 1,32,655 (one fuel, three maintenance). The other 413, worth Rs 16,91,745, carry no flock. '
   || 'WHY IT MATTERS: Flock Management -> flock -> Financial and Cost & Income read farm_expenses filtered on '
   || 'flock_id and nothing else (FlockDetail.tsx, query flock_other_expenses), so an expense with a blank flock '
   || 'reaches no flock at all. Every flock except 23 shows Rs 0 of other expenses, and its cost per egg is '
   || 'understated by that much. By site: Agraharam Potlapally 104 rows all untagged, Bodjanampet-1 70 untagged, '
   || 'Bodjanampet-2 (VHL) 13 untagged, Head Office 73 untagged, Feed Mill 9 untagged, no-site 112 untagged, '
   || 'Kethireddypally 36 rows of which only those 4 are tagged. By month: Apr 92/0, May 97/0, Jun 75/0, Jul 108/0, '
   || 'Aug 45/4 - so the habit only started in August. '
   || 'THE REAL QUESTION IS NOT A BUG BUT A RULE: a site expense (diesel for the site generator, site repairs) may '
   || 'belong to several flocks at once, so it cannot simply be tagged to one. Either (a) the Flock field is filled '
   || 'in from now on where an expense truly belongs to one flock, or (b) site-level expenses are APPORTIONED to the '
   || 'flocks at that site by bird-days, the way site salary and electricity already are in the Financial tab. '
   || 'WAITING ON YOU: which of the two, and whether the 413 historical rows are left alone or worked through.',
   'Accounts', 'high'),

  ('Four farm expenses never reached the cash book - Rs 1,32,655 in no balance',
   'OPEN - MINE TO DO, WAITING ON YOUR GO-AHEAD. Found by migration 1171 and confirmed row by row in 1173. '
   || 'Four farm_expenses rows have no cash_book row at all: 06/08/2026 fuel Rs 40,000; 11/08/2026 maintenance '
   || 'Rs 38,340; 13/08/2026 maintenance Rs 38,340; 17/08/2026 maintenance Rs 15,975 - all Kethireddypally, Flock 23. '
   || 'EFFECT: that cash left an imprest in real life but no imprest balance shows it, so Kethireddypally''s float '
   || 'reads Rs 1,32,655 higher than the tin actually holds. They are also the ONLY four expenses tagged to a flock, '
   || 'so the sole rows a flock can see are the sole rows no imprest can see - the two screens currently share not '
   || 'one row (cross-tab: both 0, flock only 4, imprest only 273, neither 140). '
   || 'CAUSE NOT YET ESTABLISHED: Farm Expenses posts to cash_book on save, so either these were written before that '
   || 'link existed, imported by a path that skips it, or the cash_book insert failed and the toast was missed. '
   || 'FIX would be to post the four missing cash_book rows with farm_expense_id set, exactly as the screen does. '
   || 'WAITING ON YOU: confirm these four were really paid in cash out of Kethireddypally, and from which imprest.',
   'Accounts', 'high'),

  ('Head Office and Feed Mill expenses belong to no imprest - 140 rows, Rs 3,80,995',
   'OPEN - WAITING ON YOUR DECISION. Measured 04/09/2026 by migration 1171. Of the 413 farm expenses that do reach '
   || 'the cash book, 140 resolve to no imprest account: Head Office 134 rows Rs 3,70,856 and Feed Mill 6 rows '
   || 'Rs 10,139. All 140 are cash. '
   || 'WHY: the derivation in migration 1159 resolves an imprest as (1) an explicit cash_account_id, else (2) the '
   || 'site imprest whose farm_id matches, else (3) HO Imprest but ONLY when farm_id IS NULL. Head Office is '
   || 'site_type office and Feed Mill is feedmill, so migration 1155 deliberately gave neither a site imprest - and '
   || 'because Farm Expenses writes the Head Office FARM ID rather than NULL, rule 3 never fires either. '
   || 'WHERE THEY ARE NOW: visible on Accounts -> Imprest Ledger under the "Not assigned to any imprest" pseudo-account, '
   || 'counted in no balance. The other 273 rows do land correctly: Agraharam Potlapally 90, Bodjanampet-1 50, '
   || 'Bodjanampet-2 (VHL) 9, Kethireddypally 32, Mandal 43, HO Imprest 43, Dendi Naraendra Reddy 6. '
   || 'OPTIONS: (a) give Head Office and Feed Mill their own site imprests, or (b) change rule 3 so a site with no '
   || 'imprest of its own falls back to HO Imprest instead of requiring farm_id to be NULL. '
   || 'WAITING ON YOU: which of the two - (b) is one line and moves Rs 3,80,995 onto HO Imprest, (a) creates two new '
   || 'named cash boxes someone must then hold.',
   'Accounts', 'normal'),

  ('One consolidated sales report - flock, vendor, grade and type in a single view',
   'NOT BUILT - WAITING ON YOUR GO-AHEAD. Asked for on 04/09/2026: all sales in ONE report, broken down flock-wise, '
   || 'vendor-wise, grade-wise (HE A/B/C) and type-wise (JE/TE/BE), with full detail - explicitly not several '
   || 'separate reports. '
   || 'WHAT EXISTS TODAY AND WHY NONE OF IT ANSWERS IT: Accounts -> Sales Invoice Register combines HE dispatch and '
   || 'NHE sales with flock, party, type and amount, but only rows that carry an invoice number, with no quantity, '
   || 'no rate, no grade split and no grouping. Reports -> Bird / Cull Sales Report is bird sale types only. '
   || 'Reports -> Egg Stock Balance splits JE/TE/BE quantity but has no party and no money. Reports -> GST Reports is '
   || 'invoice-level with party and type but is a tax return, not a sales analysis. Company P&L and Flock P&L Summary '
   || 'give totals with no breakdown. So four of the dimensions exist, scattered across four screens, and no screen '
   || 'carries more than two of them. '
   || 'THE DATA IS ALL THERE: he_dispatch + he_dispatch_lines hold flock_id, party_id, prod_date, grade_a/b/c and rate; '
   || 'nhe_sales + nhe_sale_lines hold flock_id, party_id, sale_type (je/te/be/bird_sale/gas/manure/other), quantity, '
   || 'rate and amount. A single report reading both, with one row per sale line and grouping switchable between '
   || 'flock / party / grade / type, would cover the whole ask. '
   || 'WAITING ON YOU: go-ahead to build it, and whether it belongs under Reports as a new entry or as an extension '
   || 'of the existing Sales Invoice Register.',
   'Accounts', 'normal'),

  ('Migration runner prints only the first five statements',
   'OPEN - MINE TO DO. scripts/run_sql.py line 62 guards its result print with `if len(resp) > 0 and i < 5`, so any '
   || 'migration with more than five statements runs every statement but SHOWS only the first five. Migration 1171 '
   || 'hit this on 04/09/2026: eight diagnostic checks ran, four printed, and the four that answered the actual '
   || 'question were invisible until they were re-run as migration 1172. Migration 1169 exists for the same reason. '
   || 'EFFECT: a verify block placed late in a migration is silently not shown, which is exactly the failure mode the '
   || 'session rules warn about - trusting a green workflow rather than the job log. '
   || 'FIX: raise or drop the i < 5 cap, or always print the last statement. Small change to one line, but it touches '
   || 'the migration runner, so it is not being made without your say-so.',
   'Housekeeping', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t
  WHERE t.title = v.title AND t.task_type = 'development'
);

-- VERIFY: the five tasks are present exactly once each, and nothing else moved.
SELECT count(*)::int AS tasks_present,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       string_agg(title || ' [' || priority || ']', ' | ' ORDER BY title) AS titles
FROM public.tasks
WHERE task_type = 'development'
  AND title IN (
    'Farm expenses reach no flock, so Financial and Cost & Income understate cost',
    'Four farm expenses never reached the cash book - Rs 1,32,655 in no balance',
    'Head Office and Feed Mill expenses belong to no imprest - 140 rows, Rs 3,80,995',
    'One consolidated sales report - flock, vendor, grade and type in a single view',
    'Migration runner prints only the first five statements');
