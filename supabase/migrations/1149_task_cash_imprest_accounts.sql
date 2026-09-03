-- Migration 1149: record the cash imprest / internal transfer gap as a task.
--
-- Nothing is built here. This writes down a design gap the owner raised, so it
-- is not left in a chat transcript.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Cash imprest accounts and internal transfers',
   'NOT BUILT + WAITING ON YOU. There is no concept of a cash holder anywhere: no HO Imprest, no Mandal Imprest, no person-level imprest. '
   || 'ROOT CAUSE: cash_book.farm_id is doing two jobs at once -- which SITE bears the cost, and (implicitly) where the cash physically sits. '
   || 'They are different. Cash received AT Agraharam that goes INTO Mandal Imprest cannot be recorded, because only one of the two facts fits. '
   || 'CONSEQUENCES TODAY: no balance can be shown for Mandal Imprest or for a person holding cash; transfers only work site-to-site '
   || '(Head Office <-> a farm) because farm_id is all there is; and the two legs of a transfer are two loose rows with nothing linking them, '
   || 'so deleting one leaves the other and unbalances the book. '
   || 'PROPOSED: (1) a Cash Accounts master -- name, type (ho_imprest / mandal_imprest / site_petty / person), optional employee link, opening balance; '
   || '(2) cash_account_id on cash_book saying WHICH BOX the money moved through, leaving farm_id meaning exactly what it means today so no existing '
   || 'report, P&L or site expense figure changes; (3) transfers become account-to-account with a shared transfer id so a leg cannot be half-deleted; '
   || '(4) a balance per cash account and a per-holder statement screen. Existing 1,254 rows backfilled from farm_id so nothing is left blank. '
   || 'WAITING ON YOU (1): the real list of accounts -- load your names, not invented ones. '
   || 'WAITING ON YOU (2): is Mandal Imprest ONE account or one per mandal? '
   || 'WAITING ON YOU (3): is a person such as Dendi Srinath Reddy a HOLDER (money given is still company cash, he carries a balance and accounts for '
   || 'it later with bills, transfers to him are internal) or a PAYEE (money paid leaves the cash book as expense or advance, no ongoing balance)? '
   || 'These are completely different structures and must not be guessed.',
   'Accounts', 'high')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t
  WHERE t.title = v.title AND t.task_type = 'development'
);

-- VERIFY: present exactly once, and the pending list is otherwise undisturbed.
SELECT count(*)::int AS this_task,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type = 'development' AND status = 'pending') AS pending_dev_tasks
FROM public.tasks
WHERE task_type = 'development' AND title = 'Cash imprest accounts and internal transfers';
