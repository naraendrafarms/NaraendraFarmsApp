-- Record the 17 NHE cash book rows that lost their site, so the decision is not
-- left in the chat. The code fault behind them is fixed (the sales form read the
-- location off nhe_sales, which has no such column, so every edit reopened on
-- Head Office and saving wrote farm_id NULL); these rows are what it already did.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('17 NHE cash receipts lost their site - Rs 6,37,463 sitting in HO Imprest',
   'OPEN - WAITING ON YOUR DECISION. Measured 08/09/2026 by migrations 1197 to 1199. '
   || 'THE CAUSE, now fixed: nhe_sales has no cash_farm_id column. The location picked in '
   || '"Cash Received At" was written only onto the cash book row, but the sales form read it '
   || 'back off the SALE, where it never existed - so every edit reopened on Head Office, and '
   || 'Head Office saves as a blank site. Because saving an edit deletes and reinserts the cash '
   || 'book row, anyone who opened an old site sale to correct a rate or a DC number and pressed '
   || 'Save moved that cash off its site without being told. '
   || 'WHAT IT LEFT: 17 cash book rows worth Rs 6,37,463 carry no site, and all 17 carry no '
   || 'imprest either, so they fall back to HO Imprest. Their own flocks say where they belong - '
   || 'Agraharam Potlapally 11 rows Rs 4,29,160, Bodjanampet-2 (VHL) 5 rows Rs 2,08,108, '
   || 'Bodjanampet-1 1 row Rs 195. '
   || 'WAITING ON YOU: whether to set farm_id on those 17 rows to their flock''s site. It would '
   || 'move Rs 6,37,463 out of HO Imprest into those three site tins and change those site '
   || 'balances. NOT DONE ON MY OWN because a flock''s site is a good guess, not a record of '
   || 'where the cash physically was - a receipt genuinely taken at Head Office looks identical. '
   || 'If any of the 17 really were received at Head Office, say which and they stay put. The '
   || 'previous state would be backed up first so it can be reversed exactly.',
   'Accounts', 'high')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development');

-- Confirm it landed, and show what else is open on this thread
SELECT title, team, priority, status FROM public.tasks
WHERE task_type = 'development' AND status <> 'done'
  AND (title ILIKE '%NHE cash%' OR title ILIKE '%imprest%')
ORDER BY priority, title;
