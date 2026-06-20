-- Migration 083: Add FK CASCADE constraints so deleting nhe_sale/he_dispatch
-- automatically deletes the linked cash_book entries at DB level.
-- Also re-runs a broader backfill to catch entries the migration 082 missed.

-- Step 1: Broader backfill for nhe_sales — match by flock_id + date + reference_no (dc_no).
-- Ignores amount to handle partial-cash payments where amount_in ≠ ns.amount.
-- Only updates rows still unlinked (nhe_sale_id IS NULL).

-- First: match where dc_no is known and unique per (flock, date, dc_no)
UPDATE public.cash_book cb
SET nhe_sale_id = ns.id
FROM (
  SELECT id, flock_id, sale_date, dc_no, payment_cash, amount
  FROM public.nhe_sales
  WHERE payment_mode = 'Cash' AND payment_status = 'Received'
) ns
WHERE cb.nhe_sale_id IS NULL
  AND cb.flock_id    = ns.flock_id
  AND cb.txn_date    = ns.sale_date
  AND cb.txn_type    = 'receipt'
  AND cb.payment_mode = 'cash'
  AND ns.dc_no IS NOT NULL
  AND cb.reference_no = ns.dc_no;

-- Second: match remaining (no dc_no) by flock_id + date + amount_in
-- Only where the match is unambiguous (exactly one nhe_sale for that flock+date)
UPDATE public.cash_book cb
SET nhe_sale_id = ns.id
FROM (
  SELECT ns.id, ns.flock_id, ns.sale_date, COALESCE(ns.payment_cash, ns.amount) AS cash_amt
  FROM public.nhe_sales ns
  WHERE ns.payment_mode = 'Cash' AND ns.payment_status = 'Received'
    AND ns.dc_no IS NULL
  AND NOT EXISTS (
    -- Skip if another sale on same flock+date would be ambiguous
    SELECT 1 FROM public.nhe_sales ns2
    WHERE ns2.id <> ns.id
      AND ns2.flock_id = ns.flock_id
      AND ns2.sale_date = ns.sale_date
      AND ns2.payment_mode = 'Cash'
      AND COALESCE(ns2.payment_cash, ns2.amount) = COALESCE(ns.payment_cash, ns.amount)
  )
) ns
WHERE cb.nhe_sale_id IS NULL
  AND cb.flock_id    = ns.flock_id
  AND cb.txn_date    = ns.sale_date
  AND cb.txn_type    = 'receipt'
  AND cb.payment_mode = 'cash'
  AND cb.amount_in   = ns.cash_amt;

-- Step 2: Same broader backfill for he_dispatch
UPDATE public.cash_book cb
SET he_dispatch_id = hd.id
FROM public.he_dispatch hd
WHERE cb.he_dispatch_id IS NULL
  AND cb.flock_id    = hd.flock_id
  AND cb.txn_date    = hd.dispatch_date
  AND cb.txn_type    = 'receipt'
  AND cb.payment_mode = 'cash'
  AND hd.payment_mode  = 'Cash'
  AND hd.payment_status = 'Received'
  AND hd.invoice_no IS NOT NULL
  AND cb.reference_no = hd.invoice_no;

-- Step 3: Add FK constraints with ON DELETE CASCADE.
-- This means: whenever an nhe_sale or he_dispatch row is deleted,
-- PostgreSQL automatically deletes linked cash_book rows — no frontend code needed.

ALTER TABLE public.cash_book
  DROP CONSTRAINT IF EXISTS fk_cash_book_nhe_sale,
  DROP CONSTRAINT IF EXISTS fk_cash_book_he_dispatch;

ALTER TABLE public.cash_book
  ADD CONSTRAINT fk_cash_book_nhe_sale
    FOREIGN KEY (nhe_sale_id) REFERENCES public.nhe_sales(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_cash_book_he_dispatch
    FOREIGN KEY (he_dispatch_id) REFERENCES public.he_dispatch(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
