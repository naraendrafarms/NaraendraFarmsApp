-- Marker column so auto-created GRN rows (from POPages.tsx receiptMut's
-- stock-receipt flow) can be safely distinguished from manually-created GRN
-- rows that happen to share the same po_id. Needed so that reversing a PO's
-- material_status away from 'Received' (or deleting the PO) can clean up
-- ONLY the GRN row it auto-created, never a manually entered one.
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS auto_source text;

-- Diagnostic: confirm the column exists.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'grn' AND column_name = 'auto_source';
