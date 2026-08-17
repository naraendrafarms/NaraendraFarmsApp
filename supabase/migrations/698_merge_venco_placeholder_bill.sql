-- Venco Research: merge the placeholder bill into the real one.
--
-- Two rows, same vendor, same 39,975, neither with an invoice number:
--   GRN 2086  05/06/2026  Breeder Females  unpaid, Pending   <- the real GRN
--   GRN 0000  06/08/2026                   paid 39,975 from advance
-- The farm confirms 2086 is the same purchase and 0000 was a placeholder typed
-- when the payment was settled.
--
-- The payment MOVES onto 2086 rather than either row being deleted outright:
-- deleting the unpaid row would leave a settled bill hanging off a GRN number
-- that does not exist, and deleting the paid row would destroy the settlement.
-- Any cash book or bank ledger entry pointing at the placeholder is repointed
-- first, so no ledger line is left referring to a row that has gone.

-- BEFORE.
SELECT COALESCE(string_agg('grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
       || ' paid=' || COALESCE(paid_amount::text,'0')
       || ' adv=' || COALESCE(advance_adjusted::text,'0')
       || ' st=' || COALESCE(payment_status,'(null)'), ' | ' ORDER BY grn_no), 'NONE') AS before_merge
FROM public.pending_payments WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975;

-- 1. Ledger links first, while the placeholder row still exists.
UPDATE public.cash_book cb
SET pending_payment_id = (SELECT id FROM public.pending_payments
                          WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975 AND grn_no = '2086')
WHERE cb.pending_payment_id = (SELECT id FROM public.pending_payments
                               WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975 AND grn_no = '0000');

UPDATE public.bank_transactions bt
SET linked_payment_id = (SELECT id FROM public.pending_payments
                         WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975 AND grn_no = '2086')
WHERE bt.linked_payment_id = (SELECT id FROM public.pending_payments
                              WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975 AND grn_no = '0000');

-- 2. Copy the settlement onto the real bill.
UPDATE public.pending_payments t
SET paid_amount       = s.paid_amount,
    advance_adjusted  = s.advance_adjusted,
    discount_amount   = COALESCE(s.discount_amount, t.discount_amount),
    payment_status    = s.payment_status,
    paid_date         = s.paid_date,
    account_type      = COALESCE(s.account_type, t.account_type),
    utr_no            = COALESCE(s.utr_no, t.utr_no),
    bank_account_id   = COALESCE(s.bank_account_id, t.bank_account_id),
    vendor_advance_id = COALESCE(s.vendor_advance_id, t.vendor_advance_id),
    remarks           = COALESCE(t.remarks, '') ||
                        ' [settlement merged from placeholder GRN 0000 on 17/08/2026]'
FROM public.pending_payments s
WHERE t.vendor_name ILIKE '%venco%' AND t.invoice_amount = 39975 AND t.grn_no = '2086'
  AND s.vendor_name ILIKE '%venco%' AND s.invoice_amount = 39975 AND s.grn_no = '0000';

-- 3. Remove the placeholder, now that nothing points at it and its money has
--    been carried across.
DELETE FROM public.pending_payments
WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975 AND grn_no = '0000';

-- AFTER: one row, on the real GRN, carrying the payment.
SELECT COALESCE(string_agg('grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
       || ' paid=' || COALESCE(paid_amount::text,'0')
       || ' adv=' || COALESCE(advance_adjusted::text,'0')
       || ' st=' || COALESCE(payment_status,'(null)'), ' | ' ORDER BY grn_no), 'NONE') AS after_merge
FROM public.pending_payments WHERE vendor_name ILIKE '%venco%' AND invoice_amount = 39975;

-- Nothing left open for Venco, and no orphaned ledger links.
SELECT (SELECT COUNT(*)::text FROM public.pending_payments
        WHERE vendor_name ILIKE '%venco%' AND COALESCE(payment_status,'Pending') <> 'Paid') AS venco_still_open,
       (SELECT COUNT(*)::text FROM public.cash_book cb
        WHERE cb.pending_payment_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.pending_payments p WHERE p.id = cb.pending_payment_id)) AS orphan_cash_links,
       (SELECT COUNT(*)::text FROM public.bank_transactions bt
        WHERE bt.linked_payment_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.pending_payments p WHERE p.id = bt.linked_payment_id)) AS orphan_bank_links;
