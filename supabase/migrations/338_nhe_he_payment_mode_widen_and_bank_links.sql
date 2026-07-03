-- 1. Widen nhe_sales/he_dispatch payment_mode CHECK constraints (migration
-- 076) to include every value the Receive Payment modal in
-- FlockSalesPages.tsx can actually send (Cash, NEFT, RTGS, Bank Transfer,
-- UPI, Cheque, Advance). Confirmed live via migration 337 diagnostic - the
-- old constraint only allowed Cash/Bank Transfer/Cheque/UPI, silently
-- blocking NEFT/RTGS/Advance receipts from ever saving.
ALTER TABLE public.nhe_sales DROP CONSTRAINT IF EXISTS nhe_sales_payment_mode_check;
ALTER TABLE public.nhe_sales ADD CONSTRAINT nhe_sales_payment_mode_check
  CHECK (payment_mode IN ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance'));

ALTER TABLE public.he_dispatch DROP CONSTRAINT IF EXISTS he_dispatch_payment_mode_check;
ALTER TABLE public.he_dispatch ADD CONSTRAINT he_dispatch_payment_mode_check
  CHECK (payment_mode IN ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance'));

-- 2. bank_transactions never got nhe_sale_id/he_dispatch_id link columns
-- (only cash_book did, in migration 082) - so re-editing a sale/dispatch
-- that received an online payment has no way to find and delete the
-- previous bank_transactions credit before re-inserting, duplicating it
-- on every save. Add the same link columns bank_transactions already has
-- for other sources (linked_payment_id, salary_monthly_id, party_id).
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS nhe_sale_id    UUID,
  ADD COLUMN IF NOT EXISTS he_dispatch_id UUID;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_nhe_sale_id
  ON public.bank_transactions(nhe_sale_id) WHERE nhe_sale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_he_dispatch_id
  ON public.bank_transactions(he_dispatch_id) WHERE he_dispatch_id IS NOT NULL;
