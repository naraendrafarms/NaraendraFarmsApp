-- Correction to 590.
--
-- 590 added statutory_liabilities.paid_via_partner_id, referencing `partners`,
-- on the assumption that Hitech is a partner. It is not. 592 measured it:
--   partners  = Amit Das, Dendi Naraendra Reddy, Gottipati Parmita Das,
--               Radheshyam Roy, Ranu Halder, Sumit Das   -- no Hitech
--   parties   = "Hitech Hatch Fresh Private Limited" (type 'both')
-- So the payer could never have been selected, and the feature would have
-- been unusable for the only case it was built for.
--
-- Adding paid_via_party_id alongside. Both columns stay: a challan might one
-- day be remitted by an individual partner, and dropping a column that 590
-- already shipped would be a needless breaking change. Exactly one of the two
-- should be set, which the CHECK below enforces.

ALTER TABLE public.statutory_liabilities
  ADD COLUMN IF NOT EXISTS paid_via_party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.statutory_liabilities.paid_via_party_id IS
  'Party (e.g. Hitech Hatch Fresh Private Limited) who remitted this challan on our behalf. NULL with paid_via_partner_id NULL means paid from our own bank account.';

CREATE INDEX IF NOT EXISTS idx_statutory_paid_via_party
  ON public.statutory_liabilities(paid_via_party_id);

-- A challan has one payer. Both set would make the funding balance ambiguous.
ALTER TABLE public.statutory_liabilities
  DROP CONSTRAINT IF EXISTS statutory_liabilities_one_payer;

ALTER TABLE public.statutory_liabilities
  ADD CONSTRAINT statutory_liabilities_one_payer
  CHECK (paid_via_party_id IS NULL OR paid_via_partner_id IS NULL);

-- Bank transfers funding that payer need the same handle. 590 added
-- partner_id; parties need one too so a transfer to Hitech is identifiable.
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_txn_party ON public.bank_transactions(party_id);

-- ── Verification ────────────────────────────────────────────────────────────
SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, column_name), 'MISSING') AS payer_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'statutory_liabilities' AND column_name IN ('paid_via_party_id','paid_via_partner_id'))
    OR (table_name = 'bank_transactions' AND column_name IN ('party_id','partner_id')));

SELECT COALESCE(string_agg(id::text || ' ' || name, ' | '), 'NOT FOUND') AS hitech_party
FROM public.parties WHERE name ILIKE '%hitech%';

SELECT COUNT(*) AS liabilities_total,
       COUNT(paid_via_party_id) AS party_paid,
       COUNT(paid_via_partner_id) AS partner_paid
FROM public.statutory_liabilities;

NOTIFY pgrst, 'reload schema';
