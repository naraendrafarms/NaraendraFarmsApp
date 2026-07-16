-- Electricity bills previously treated payment as one all-or-nothing event
-- (a single paid_date + payment_mode + bank_account_id on the bill itself,
-- migration 464). Users need to record partial payments and settle the
-- balance later, like pending_payments already supports for vendor bills.
-- Unlike pending_payments (running total only), electricity needs a FULL
-- HISTORY of each part-payment, so this adds its own log table.

CREATE TABLE IF NOT EXISTS public.electricity_bill_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id          UUID NOT NULL REFERENCES public.electricity_bills(id) ON DELETE CASCADE,
  paid_date        DATE NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  payment_mode     TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash','bank')),
  bank_account_id  UUID REFERENCES public.bank_accounts(id),
  remarks          TEXT,
  batch_ref        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.electricity_bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ebp_select ON public.electricity_bill_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY ebp_insert ON public.electricity_bill_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ebp_update ON public.electricity_bill_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY ebp_delete ON public.electricity_bill_payments FOR DELETE TO authenticated USING (true);
DROP TRIGGER IF EXISTS trg_audit ON public.electricity_bill_payments;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.electricity_bill_payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE INDEX IF NOT EXISTS idx_ebp_bill_id ON public.electricity_bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_ebp_batch_ref ON public.electricity_bill_payments(batch_ref) WHERE batch_ref IS NOT NULL;

ALTER TABLE public.cash_book         ADD COLUMN IF NOT EXISTS electricity_payment_id UUID REFERENCES public.electricity_bill_payments(id) ON DELETE SET NULL;
ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS electricity_payment_id UUID REFERENCES public.electricity_bill_payments(id) ON DELETE SET NULL;

-- A single CMS bank transaction can settle several electricity_bills across
-- different meters/farms at once. In that case ONE cash_book/bank_transactions
-- row (the real bank debit) corresponds to MANY electricity_bill_payments rows
-- (one per bill). electricity_payment_id can't represent a 1-row-to-many
-- relationship, so batch-paid ledger rows are tagged via batch_ref instead
-- (electricity_payment_id stays NULL on them) and traced back to their group
-- of payment rows by matching electricity_bill_payments.batch_ref.
ALTER TABLE public.cash_book         ADD COLUMN IF NOT EXISTS batch_ref TEXT;
ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS batch_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_cash_book_electricity_payment_id
  ON public.cash_book(electricity_payment_id) WHERE electricity_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_electricity_payment_id
  ON public.bank_transactions(electricity_payment_id) WHERE electricity_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_book_batch_ref
  ON public.cash_book(batch_ref) WHERE batch_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_batch_ref
  ON public.bank_transactions(batch_ref) WHERE batch_ref IS NOT NULL;

-- Backfill: every existing bill with a paid_date becomes one payment row
-- under the old single-payment model.
INSERT INTO public.electricity_bill_payments (bill_id, paid_date, amount, payment_mode, bank_account_id, remarks)
SELECT id, paid_date, (amount - COALESCE(deposit_interest,0)), COALESCE(payment_mode,'cash'), bank_account_id, 'Migrated from single-payment record'
FROM public.electricity_bills
WHERE paid_date IS NOT NULL;

-- Backfill electricity_payment_id on existing ledger rows that were linked
-- via electricity_bill_id under the old model (exactly one payment row per
-- bill at this point, so the match is 1:1).
UPDATE public.cash_book cb
SET electricity_payment_id = ebp.id
FROM public.electricity_bill_payments ebp
WHERE cb.electricity_bill_id = ebp.bill_id
  AND cb.electricity_payment_id IS NULL;

UPDATE public.bank_transactions bt
SET electricity_payment_id = ebp.id
FROM public.electricity_bill_payments ebp
WHERE bt.electricity_bill_id = ebp.bill_id
  AND bt.electricity_payment_id IS NULL;

-- Diagnostics
SELECT count(*) AS ebp_table_exists FROM information_schema.tables WHERE table_name='electricity_bill_payments';
SELECT count(*) AS cb_col_exists FROM information_schema.columns WHERE table_name='cash_book' AND column_name IN ('electricity_payment_id','batch_ref');
SELECT count(*) AS bt_col_exists FROM information_schema.columns WHERE table_name='bank_transactions' AND column_name IN ('electricity_payment_id','batch_ref');
SELECT count(*) AS ebp_batch_ref_col FROM information_schema.columns WHERE table_name='electricity_bill_payments' AND column_name='batch_ref';
SELECT count(*) AS backfilled_payments FROM public.electricity_bill_payments WHERE remarks='Migrated from single-payment record';
SELECT count(*) AS cb_linked FROM public.cash_book WHERE electricity_payment_id IS NOT NULL;
SELECT count(*) AS bt_linked FROM public.bank_transactions WHERE electricity_payment_id IS NOT NULL;
SELECT count(*) AS bills_with_paid_date FROM public.electricity_bills WHERE paid_date IS NOT NULL;
