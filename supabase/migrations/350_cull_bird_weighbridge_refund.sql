-- Migration 350: Cull Bird Sale — weighbridge (Gross/Tare/Net), Female/Male
-- split under Mixed, and a refund-of-excess-payment link to bank_transactions.

ALTER TABLE public.nhe_sales
  ADD COLUMN IF NOT EXISTS gross_weight_kg   NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS tare_weight_kg     NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS net_weight_kg      NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS female_qty         INTEGER,
  ADD COLUMN IF NOT EXISTS female_weight_kg   NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS male_qty           INTEGER,
  ADD COLUMN IF NOT EXISTS male_weight_kg     NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS refund_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS refund_date        DATE,
  ADD COLUMN IF NOT EXISTS refund_bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_bank_txn_id UUID REFERENCES public.bank_transactions(id) ON DELETE SET NULL;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='nhe_sales'
  AND column_name IN ('gross_weight_kg','tare_weight_kg','net_weight_kg','female_qty','female_weight_kg','male_qty','male_weight_kg','refund_amount','refund_date','refund_bank_account_id','refund_bank_txn_id')
ORDER BY column_name;
