-- Migration 190: Financial-year openings for Cash Book and Bank Ledger.
-- Cash: add fy to cash_book_opening (existing rows keep fy=NULL = legacy/default).
-- Bank: new bank_fy_opening table (per account per FY); falls back to bank_accounts.opening_balance.

ALTER TABLE public.cash_book_opening
  ADD COLUMN IF NOT EXISTS fy TEXT;

CREATE TABLE IF NOT EXISTS public.bank_fy_opening (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  fy              TEXT NOT NULL,
  opening_balance NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (bank_account_id, fy)
);

ALTER TABLE public.bank_fy_opening ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bfo_all ON public.bank_fy_opening;
CREATE POLICY bfo_all ON public.bank_fy_opening FOR ALL TO authenticated USING (true) WITH CHECK (true);

SELECT 'ok' AS status;
