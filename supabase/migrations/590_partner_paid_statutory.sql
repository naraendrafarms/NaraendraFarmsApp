-- Statutory challans (TDS, ESI, PF, PT, advance tax, GST including RCM, and
-- late fees) are paid from the Hitech partner's bank account, not ours: money
-- is transferred to them and they remit it. Today that is two disconnected
-- entries — a bank payment to Hitech, and a liability marked Paid — with
-- nothing showing how much of our money is still lying with them.
--
-- Three additive changes:
--   1. advance_tax and late_fee become liability types (they were missing, so
--      those payments had nowhere to go at all).
--   2. A liability records WHO paid it. Paid via a partner means our bank was
--      not touched at that moment — the money left when we transferred it.
--   3. bank_transactions can be tagged to a partner, so a transfer to Hitech
--      is identifiable as funding rather than an expense.
--
-- Nothing here changes an existing row's meaning: every current liability has
-- paid_via_partner_id NULL, which reads as "paid from our own account", the
-- only behaviour that existed before.

-- ── 1. Widen the liability types ────────────────────────────────────────────
-- A CHECK constraint cannot be extended in place; drop and recreate it. Named
-- explicitly rather than relying on the generated name.
ALTER TABLE public.statutory_liabilities
  DROP CONSTRAINT IF EXISTS statutory_liabilities_liability_type_check;

ALTER TABLE public.statutory_liabilities
  ADD CONSTRAINT statutory_liabilities_liability_type_check
  CHECK (liability_type IN ('tds_payable','tds_receivable','gst_payable',
                            'pf_payable','esi_payable','pt_payable',
                            'advance_tax','late_fee'));

-- ── 2. Who actually remitted it ─────────────────────────────────────────────
ALTER TABLE public.statutory_liabilities
  ADD COLUMN IF NOT EXISTS paid_via_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.statutory_liabilities.paid_via_partner_id IS
  'Partner who remitted this challan on our behalf. NULL means paid from our own bank account. When set, no bank/cash entry belongs against the payment date - the money left when it was transferred to that partner.';

CREATE INDEX IF NOT EXISTS idx_statutory_paid_via_partner
  ON public.statutory_liabilities(paid_via_partner_id);

-- ── 3. Tag a bank transfer to a partner ─────────────────────────────────────
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_txn_partner ON public.bank_transactions(partner_id);

-- ── Verification ────────────────────────────────────────────────────────────
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'MISSING') AS new_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'statutory_liabilities' AND column_name = 'paid_via_partner_id')
    OR (table_name = 'bank_transactions' AND column_name = 'partner_id'));

-- The widened CHECK must actually accept the new values.
SELECT pg_get_constraintdef(oid) AS liability_type_check
FROM pg_constraint
WHERE conrelid = 'public.statutory_liabilities'::regclass
  AND conname = 'statutory_liabilities_liability_type_check';

-- Existing rows are untouched and still read as paid from our own account.
SELECT COUNT(*) AS liabilities_total,
       COUNT(paid_via_partner_id) AS already_marked_partner_paid
FROM public.statutory_liabilities;

NOTIFY pgrst, 'reload schema';
