-- Migration 076: Add payment receipt tracking to nhe_sales and he_dispatch
-- Allows recording cash/bank receipts for all types of sales (eggs, birds, litter, manure)

ALTER TABLE public.nhe_sales
  ADD COLUMN IF NOT EXISTS payment_status  TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Received','Partial')),
  ADD COLUMN IF NOT EXISTS amount_received NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS received_date   DATE,
  ADD COLUMN IF NOT EXISTS payment_mode    TEXT CHECK (payment_mode IN ('Cash','Bank Transfer','Cheque','UPI')),
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utr_ref         TEXT;

ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS payment_status  TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Received','Partial')),
  ADD COLUMN IF NOT EXISTS amount_received NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS received_date   DATE,
  ADD COLUMN IF NOT EXISTS payment_mode    TEXT CHECK (payment_mode IN ('Cash','Bank Transfer','Cheque','UPI')),
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utr_ref         TEXT;

-- When a sale is marked as received via bank, auto-create a bank_transaction credit entry
-- (done in application layer, not DB trigger, to keep logic visible)

NOTIFY pgrst, 'reload schema';
