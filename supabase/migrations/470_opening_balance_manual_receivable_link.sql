-- Dr opening balance on a buyer (e.g. Venkateswara Foods and Feeds — "Extra
-- Eggs" receivable) only ever landed in Party Ledger — Daily Payment
-- Planning's "Pending Receivables" only reads real nhe_sales/he_dispatch
-- rows, so it never showed up there at all. Auto-create a Manual Item
-- (the existing ad-hoc payable/receivable list on that same page) instead,
-- linked back so it stays in sync and cleans up on delete — mirroring the
-- Dr/supplier -> vendor_advances fix (migration 469).
ALTER TABLE public.payment_plan_manual_items ADD COLUMN IF NOT EXISTS opening_balance_id UUID REFERENCES public.opening_balances(id) ON DELETE CASCADE;

SELECT count(*) AS ppmi_col_exists FROM information_schema.columns
  WHERE table_name='payment_plan_manual_items' AND column_name='opening_balance_id';
