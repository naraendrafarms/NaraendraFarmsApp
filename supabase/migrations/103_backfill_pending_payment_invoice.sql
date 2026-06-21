-- Backfill invoice_no on pending_payments where it is NULL but grn_no looks like
-- an invoice number (not an auto-generated GRN-date-nnnnn placeholder).
-- Auto-generated placeholders start with a category prefix like "MEDICINE-", "OTHER-"
-- followed by digits. Real invoice numbers are typically shorter or human-typed.
-- We copy grn_no → invoice_no only when invoice_no is null AND grn_no does NOT
-- match the auto-generated pattern.

UPDATE public.pending_payments
SET invoice_no = grn_no
WHERE invoice_no IS NULL
  AND grn_no IS NOT NULL
  AND grn_no !~ '^[A-Z]+-[0-9]{5,}$'   -- skip auto-generated: "MEDICINE-12345", "OTHER-98765"
  AND grn_no !~ '^GRN-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]+$'; -- skip GRN-date-timestamp pattern
