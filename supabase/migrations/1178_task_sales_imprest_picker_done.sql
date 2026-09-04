-- Migration 1178: the sales-side imprest picker shipped, so its task closes in
-- the session it shipped.
--
-- Nothing outside public.tasks is touched.

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 04/09/2026: a "Received into (Imprest)" box now sits under Cash Received At in BOTH writers of a sale receipt -- the NHE Sales entry form and the Receive Payment modal shared with HE Dispatch -- and writes cash_account_id onto the cash_book row. Blank keeps the existing site derivation, so ordinary entry is unchanged, and the placeholder NAMES the default account (e.g. "Bodjanampet - 1 Site Imprest (default)") so the clerk can see where the cash will land without knowing the rule. It is only filled in when a PERSON collected on a site behalf. Persisted to nhe_sales.cash_account_id -- the column added by 1155 and written by nothing until now -- so reopening a sale prefills the choice; he_dispatch needs no column because the imprest lives on the cash_book row. A sale with no cash (fully online, or unpaid) is never tagged. Covers the credit-sale case: the tin is named on the day the money arrives, not the day the sale was billed. NOT BACKFILLED: existing receipts keep deriving from their location, since no historical row records which person took the cash and guessing would move balances on accounts carrying real names.'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title = 'Sales receipts cannot name the imprest that received the cash';

-- VERIFY: closed, and what remains of the money-related set.
SELECT (SELECT COALESCE(status,'MISSING') FROM public.tasks
        WHERE task_type='development'
          AND title='Sales receipts cannot name the imprest that received the cash'
        LIMIT 1) AS picker_task,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') AS open_total,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
          AND priority='high') AS open_high;
