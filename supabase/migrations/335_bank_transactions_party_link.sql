-- Manual Bank Ledger entries currently have no way to link to a specific
-- vendor/party from the Parties master - only a free-text Description.
-- Add a proper party_id FK so manually-entered rows are traceable, same as
-- auto-linked rows are traceable via linked_payment_id/salary_monthly_id.
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;
