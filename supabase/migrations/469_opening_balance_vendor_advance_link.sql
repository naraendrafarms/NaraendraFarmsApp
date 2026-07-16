-- Opening Balances entered as Dr for a supplier (e.g. an advance paid to a
-- vendor last FY, not yet adjusted against GRN bills) previously only ever
-- landed in Party Ledger — there was no matching vendor_advances row, so the
-- existing "Advance (adjust against existing balance)" picker in Pending
-- Payments had nothing to find for it. Cr (payable) openings already
-- auto-create a pending_payments bill the same way; this mirrors that for
-- the Dr/supplier-advance case.
ALTER TABLE public.vendor_advances ADD COLUMN IF NOT EXISTS opening_balance_id UUID REFERENCES public.opening_balances(id) ON DELETE SET NULL;

SELECT count(*) AS va_col_exists FROM information_schema.columns
  WHERE table_name='vendor_advances' AND column_name='opening_balance_id';
