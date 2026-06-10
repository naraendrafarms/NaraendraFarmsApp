-- Migration 024: Extend payments + bank accounts + bank ledger

-- Add extra fields to pending_payments
ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS invoice_no      TEXT,
  ADD COLUMN IF NOT EXISTS utr_no          TEXT,
  ADD COLUMN IF NOT EXISTS cheque_no       TEXT,
  ADD COLUMN IF NOT EXISTS transaction_ref TEXT,
  ADD COLUMN IF NOT EXISTS remarks         TEXT,
  ADD COLUMN IF NOT EXISTS po_id           UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bank_account_id UUID;

-- Our internal bank accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_name       TEXT NOT NULL,
  account_name    TEXT,
  account_no      TEXT,
  ifsc            TEXT,
  branch          TEXT,
  opening_balance NUMERIC(14,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_bank_accounts"   ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_accounts" ON public.bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_accounts" ON public.bank_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_bank_accounts" ON public.bank_accounts FOR DELETE TO authenticated USING (true);

-- Bank transaction ledger
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_account_id     UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  txn_date            DATE NOT NULL,
  txn_type            TEXT NOT NULL CHECK (txn_type IN ('Credit','Debit')),
  category            TEXT,
  reference_no        TEXT,
  description         TEXT,
  amount              NUMERIC(14,2) NOT NULL,
  linked_payment_id   UUID REFERENCES public.pending_payments(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_bank_txn"   ON public.bank_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_txn" ON public.bank_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_txn" ON public.bank_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_bank_txn" ON public.bank_transactions FOR DELETE TO authenticated USING (true);

-- FK from pending_payments to bank_accounts
ALTER TABLE public.pending_payments
  ADD CONSTRAINT fk_payment_bank_account
  FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Add delete policy for purchase_orders and pending_payments if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchase_orders' AND policyname='auth_delete_purchase_orders'
  ) THEN
    CREATE POLICY "auth_delete_purchase_orders"
      ON public.purchase_orders FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='pending_payments' AND policyname='auth_delete_pending_payments'
  ) THEN
    CREATE POLICY "auth_delete_pending_payments"
      ON public.pending_payments FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='vendor_bank_details' AND policyname='auth_delete_vendor_bank_details'
  ) THEN
    CREATE POLICY "auth_delete_vendor_bank_details"
      ON public.vendor_bank_details FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
