-- Add GST classification columns to medicine_purchases
ALTER TABLE public.medicine_purchases
  ADD COLUMN IF NOT EXISTS supply_type   TEXT DEFAULT 'intra',
  ADD COLUMN IF NOT EXISTS nature        TEXT DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS is_rcm        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cgst_amount   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sgst_amount   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS igst_amount   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS party_gstin   TEXT,
  ADD COLUMN IF NOT EXISTS hsn_code      TEXT;

-- Fix HHF invoice counter — user tested Generate once (consumed 51) then cancelled.
-- Real last filed invoice was 50, so next real invoice should be 51.
-- Setting current_no back to 50 so fn_next_invoice / fn_peek_invoice returns 51.
UPDATE public.invoice_series SET current_no = 50 WHERE code = 'HHF' AND current_no = 51;
