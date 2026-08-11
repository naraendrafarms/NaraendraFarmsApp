-- Split payments for HE Dispatch — part cash, part online — matching what
-- nhe_sales has had since migration 061 rather than inventing a second pattern.
--
-- nhe_sales already carries payment_cash / payment_online, and 455 widened its
-- payment_mode CHECK to accept 'Cash+NEFT' so a split reads as a split rather
-- than being collapsed to one mode. he_dispatch got neither: 338 gave it a
-- CHECK without 'Cash+NEFT', and it has no split amount columns at all.
--
-- The consequence today is not a save error but silent data loss: recording a
-- second payment on a dispatch overwrites the first, and the modal deletes the
-- previous cash_book / bank_transactions rows before writing the new one — so
-- the earlier receipt disappears from the ledgers entirely.
--
-- The ledger rows already carry each component's own amount, so payment_mode
-- stays a display label; the money is recorded by the cash_book and
-- bank_transactions entries, one per component.

-- 1. The split amounts.
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS payment_cash   NUMERIC(14,2) DEFAULT 0;

ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS payment_online NUMERIC(14,2) DEFAULT 0;

-- 2. Allow the split label. Same value nhe_sales uses, so both tables read the
--    same way in reports.
ALTER TABLE public.he_dispatch DROP CONSTRAINT IF EXISTS he_dispatch_payment_mode_check;
ALTER TABLE public.he_dispatch ADD CONSTRAINT he_dispatch_payment_mode_check
  CHECK (payment_mode IS NULL OR payment_mode IN
    ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance','Cash+NEFT'));

-- 3. Backfill: every dispatch already marked received becomes a single-component
--    split, so the new columns agree with the payments already recorded and
--    nothing has to be re-keyed. Cash-mode receipts fill payment_cash, every
--    other mode fills payment_online. Advance-adjusted receipts are left at
--    zero — their money lives in party_advances, not in cash or bank.
UPDATE public.he_dispatch
SET payment_cash   = CASE WHEN payment_mode = 'Cash' THEN COALESCE(amount_received, 0) ELSE 0 END,
    payment_online = CASE WHEN payment_mode IS NOT NULL
                           AND payment_mode NOT IN ('Cash','Advance')
                          THEN COALESCE(amount_received, 0) ELSE 0 END
WHERE COALESCE(payment_cash, 0) = 0
  AND COALESCE(payment_online, 0) = 0
  AND COALESCE(amount_received, 0) > 0;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'MISSING') AS new_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'he_dispatch'
  AND column_name IN ('payment_cash', 'payment_online');

SELECT pg_get_constraintdef(oid) AS payment_mode_check
FROM pg_constraint WHERE conname = 'he_dispatch_payment_mode_check';

-- The split must reconcile with what was already recorded: for every paid
-- dispatch, cash + online should equal amount_received (except advances).
SELECT COUNT(*) AS paid_dispatches,
       COUNT(*) FILTER (WHERE COALESCE(payment_cash,0) + COALESCE(payment_online,0)
                              = COALESCE(amount_received,0)) AS split_matches_received,
       COUNT(*) FILTER (WHERE payment_mode = 'Advance') AS advance_paid_left_at_zero
FROM public.he_dispatch
WHERE COALESCE(amount_received, 0) > 0;

NOTIFY pgrst, 'reload schema';
