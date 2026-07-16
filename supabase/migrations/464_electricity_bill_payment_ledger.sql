-- Electricity bill payments never touched Cash Book / Bank Ledger — marking
-- a bill "Paid" only set a paid_date flag on the bill itself, with no
-- payment mode, no bank account, and no linked ledger row. Add the same
-- payment-mode + bank-account + ledger-link pattern already used for
-- vendor advances (migrations 434/435).
ALTER TABLE public.electricity_bills ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash','bank'));
ALTER TABLE public.electricity_bills ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);

ALTER TABLE public.cash_book         ADD COLUMN IF NOT EXISTS electricity_bill_id UUID REFERENCES public.electricity_bills(id) ON DELETE SET NULL;
ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS electricity_bill_id UUID REFERENCES public.electricity_bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_book_electricity_bill_id
  ON public.cash_book(electricity_bill_id) WHERE electricity_bill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_electricity_bill_id
  ON public.bank_transactions(electricity_bill_id) WHERE electricity_bill_id IS NOT NULL;

SELECT count(*) AS eb_cols FROM information_schema.columns
  WHERE table_name='electricity_bills' AND column_name IN ('payment_mode','bank_account_id');
SELECT count(*) AS cb_col FROM information_schema.columns
  WHERE table_name='cash_book' AND column_name='electricity_bill_id';
SELECT count(*) AS bt_col FROM information_schema.columns
  WHERE table_name='bank_transactions' AND column_name='electricity_bill_id';
