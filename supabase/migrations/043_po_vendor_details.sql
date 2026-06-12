-- Migration 043: Add vendor GSTIN, address, contact to purchase_orders
-- So when stock is received these can be auto-populated into parties master
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_gstin   TEXT,
  ADD COLUMN IF NOT EXISTS vendor_address TEXT,
  ADD COLUMN IF NOT EXISTS vendor_contact TEXT;

NOTIFY pgrst, 'reload schema';
