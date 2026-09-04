-- Migration 1176: fold the sales-side imprest gap into the existing imprest
-- picker task, and list what is actually still open.
--
-- THE GAP, found while walking through two real scenarios: Farm Expenses has a
-- "Paid from (Imprest)" box, so a Bpet-1 cost paid out of Mandal's cash is
-- recorded correctly. The SALES side has no equivalent. Both places that write
-- a sale receipt to cash_book -- the NHE Sales form and the Receive Payment
-- modal shared by NHE sales and HE dispatch -- set farm_id (where the cash came
-- in) but never cash_account_id, so the imprest is ALWAYS derived from the
-- site. Cash from a Bpet-1 sale handed to Mandal, Naraendra or Srinath still
-- lands on Bpet-1's imprest: that tin reads too high and the holder's too low.
-- nhe_sales.cash_account_id already exists (added by 1155) and nothing writes it.
--
-- Folded into the existing task at the owner's instruction rather than raised
-- as a second one, since it is the same missing picker on a different form.
--
-- Branch 2 below covers the case where that task was already closed: then it
-- cannot be folded into anything, and a standalone task is raised instead.

-- [1] Fold it in, if the task is still open.
UPDATE public.tasks
SET description = description || E'\n\nADDED 04/09/2026 -- THE SALES SIDE HAS NO IMPREST PICKER AT ALL. Farm Expenses got a "Paid from (Imprest)" box in migration 1163, so an expense paid by a different cash box than the site is recorded correctly. Sales did not. Both writers of a sale receipt -- the NHE Sales form and the Receive Payment modal shared by NHE sales and HE dispatch -- set cash_book.farm_id from "Cash Received At (Location)" but never set cash_account_id, so v_imprest_entries always falls back to the SITE imprest. Consequence: cash from a Bodjanampet-1 sale handed to Mandal, Naraendra or Srinath is still counted in Bodjanampet-1''s tin -- that balance reads too high and the holder''s reads too low, with nothing on screen to explain it. This also covers the CREDIT SALE case: a sale billed today and collected weeks later posts its receipt through the same modal, so the money is tagged to wherever it was received rather than to whoever actually holds it. nhe_sales.cash_account_id already exists (added by 1155, written by nothing) so the column is there; he_dispatch has no such column and would need one. FIX: a "Received into (Imprest)" box on the NHE Sales form and on the Receive Payment modal, defaulting to the site imprest of the chosen location so ordinary entry is unchanged, and only set explicitly when a person took the cash.',
    priority = 'high'
WHERE task_type = 'development'
  AND title = 'Cash imprest accounts and internal transfers'
  AND COALESCE(status, 'pending') <> 'done';

-- [2] If that task was already closed, the gap cannot be folded anywhere, so it
-- is raised on its own rather than lost.
INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT 'Sales receipts cannot name the imprest that received the cash',
       'OPEN. Farm Expenses has a "Paid from (Imprest)" box; the sales side has none. The NHE Sales form and the Receive Payment modal (shared by NHE sales and HE dispatch) set cash_book.farm_id from "Cash Received At (Location)" but never cash_account_id, so the imprest is always derived from the SITE. Cash from a Bodjanampet-1 sale handed to Mandal, Naraendra or Srinath is still counted in Bodjanampet-1''s tin. Also affects credit sales collected later, since the receipt goes through the same modal. nhe_sales.cash_account_id exists already (1155) and is written by nothing; he_dispatch has no such column. FIX: a "Received into (Imprest)" box on both, defaulting to the site imprest of the chosen location.',
       'development', 'Accounts', 'pending', 'high'
WHERE NOT EXISTS (
        SELECT 1 FROM public.tasks WHERE task_type = 'development'
          AND title = 'Cash imprest accounts and internal transfers'
          AND COALESCE(status, 'pending') <> 'done')
  AND NOT EXISTS (
        SELECT 1 FROM public.tasks WHERE task_type = 'development'
          AND title = 'Sales receipts cannot name the imprest that received the cash');

-- [3] Which branch fired, so the outcome is reported rather than assumed.
SELECT (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND title='Cash imprest accounts and internal transfers'
          AND description LIKE '%THE SALES SIDE HAS NO IMPREST PICKER AT ALL%') AS folded_into_existing,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development'
          AND title='Sales receipts cannot name the imprest that received the cash') AS raised_separately,
       (SELECT COALESCE(status,'MISSING') FROM public.tasks
        WHERE task_type='development' AND title='Cash imprest accounts and internal transfers'
        LIMIT 1) AS imprest_task_status;

-- [4] Every open development task, so "what is pending" is answered from the
-- list itself and not from memory.
SELECT count(*)::int AS open_tasks,
       string_agg(title || ' [' || COALESCE(priority,'-') || '/' || COALESCE(team,'-') || ']', ' | '
                  ORDER BY CASE COALESCE(priority,'') WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, title) AS open_list
FROM public.tasks
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done';
