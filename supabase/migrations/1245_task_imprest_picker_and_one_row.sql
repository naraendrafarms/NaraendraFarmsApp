-- The Pending Payments imprest work is not in Tasks at all. The fix shipped
-- today; one row is left and it needs an owner decision, so both go on record
-- rather than living in a chat transcript.
INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('One cash bill payment of Rs 2,500 sits in HO Imprest instead of a site',
   'OPEN - WAITING ON YOUR DECISION, AND MY RECOMMENDATION IS TO LEAVE IT. '
   || 'FIXED AND SHIPPED 15/09/2026: Accounts -> Pending Payments showed a bank picker only for '
   || 'non-cash modes. Choosing Cash removed it with nothing in its place, so postLedgerEntry wrote '
   || 'the cash_book row with neither cash_account_id nor farm_id, and the imprest derivation - '
   || 'COALESCE(tin, the site''s own imprest, HO Imprest) - charged it to HO Imprest whatever tin '
   || 'really paid. Cash now shows PAID FROM IMPREST, required before saving, on all three routes: '
   || 'the Pay modal, Bulk Pay and the edit form. The tin is stored on the bill the way the bank '
   || 'account already was, and written onto the cash_book row. '
   || 'WHAT IS LEFT, MEASURED 15/09/2026: exactly ONE row. 06/06/2026, purchase_payment, Rs 2,500, '
   || 'derived to HO Imprest with no tin tagged. That is the entire backlog. '
   || 'WHY SO LITTLE: bill payments are almost all by bank - RTGS 90 (Rs 4.83 cr), NEFT 167 '
   || '(Rs 3.48 cr), Cheque 24 (Rs 2.03 cr), IMPS 6, UPI 1. Cash: one payment, Rs 2,500. '
   || 'WHY I SUGGEST LEAVING IT: moving one Rs 2,500 row from June is a write to live records for no '
   || 'practical gain, and HO Imprest is arguably right for a Head Office purchase payment anyway. '
   || 'IF YOU WANT IT MOVED: say which site actually paid that Rs 2,500 on 06/06/2026 and it is one '
   || 'migration, with the row backed up first. Otherwise close this task.',
   'Accounts', 'low')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development');

SELECT title, status, priority, team FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'One cash bill payment%';
