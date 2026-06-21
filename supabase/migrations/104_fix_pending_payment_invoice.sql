-- Undo migration 103 which wrongly set invoice_no = grn_no.
-- Then correctly backfill invoice_no from the grn table by matching on grn_no.

-- Step 1: Reset invoice_no that was wrongly copied from grn_no
-- We can identify these because invoice_no = grn_no (they are identical strings).
UPDATE public.pending_payments
SET invoice_no = NULL
WHERE invoice_no IS NOT NULL
  AND grn_no IS NOT NULL
  AND invoice_no = grn_no;

-- Step 2: Correctly populate invoice_no from the grn table
-- where a matching grn record exists with the same grn_no and has an invoice_no.
UPDATE public.pending_payments pp
SET invoice_no = g.invoice_no
FROM public.grn g
WHERE pp.invoice_no IS NULL
  AND pp.grn_no IS NOT NULL
  AND g.grn_no = pp.grn_no
  AND g.invoice_no IS NOT NULL;
