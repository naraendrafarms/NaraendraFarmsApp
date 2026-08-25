-- Tracks how much of a bank_transactions row's amount has actually been
-- allocated to invoice settlements so far, across possibly several separate
-- edits (settle invoice A today, come back next week and settle invoice B
-- against the same leftover amount). Without this, the app had no way to
-- know how much of a Credit was still unallocated once ANY invoice had been
-- settled against it — it only stored a single nhe_sale_id/he_dispatch_id
-- link and treated that as "fully done", hiding the settle picker forever.
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS settled_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Backfill: rows settled under the old (single-shot, always-full-amount)
-- logic before this column existed get settled_amount = amount, since that
-- old code path always applied the whole transaction amount in one save.
-- Only touches Credit rows that already carry a receivable link, so bill
-- (Debit) side rows and never-settled rows are untouched.
UPDATE public.bank_transactions
SET settled_amount = amount
WHERE txn_type = 'Credit'
  AND (nhe_sale_id IS NOT NULL OR he_dispatch_id IS NOT NULL)
  AND settled_amount = 0;

SELECT count(*)::int AS n_backfilled FROM public.bank_transactions
WHERE txn_type = 'Credit' AND (nhe_sale_id IS NOT NULL OR he_dispatch_id IS NOT NULL) AND settled_amount > 0;
