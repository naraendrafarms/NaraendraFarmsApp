-- Real merge duplicates confirmed (migration 295/298): GRN 2667 and 2699,
-- each with a row under "Sunways Bio Science LLP" (party e8a0e918..., the
-- surviving/canonical party post-merge) and a stale row under
-- "Sunways Bio-Science LLP" (party 02fb5d92..., deleted during the merge).
-- Keep the canonical-party row, carry over Paid status if the stale row
-- was paid and the kept row isn't, then drop the stale row.
-- (GRN 2447, 2722, 2735, 2741 are confirmed legitimate Material+Transport
-- coincidental grn_no reuse per user — deliberately not touched.)

UPDATE public.pending_payments kept
SET payment_status = stale.payment_status,
    paid_date = stale.paid_date,
    account_type = stale.account_type,
    utr_no = stale.utr_no,
    cheque_no = stale.cheque_no,
    transaction_ref = stale.transaction_ref
FROM public.pending_payments stale
WHERE kept.id IN ('75667141-2848-42d1-8cd4-5713d1104516', '424c73d0-dabf-4c59-8834-d7860f3b8c8a')
  AND stale.id IN ('3d015a82-7fc1-42a6-bbb9-4dca7ad7b532', 'ab1f410d-7f9c-4bd2-88ee-e9c8bea592e4')
  AND kept.grn_no = stale.grn_no
  AND stale.payment_status = 'Paid'
  AND kept.payment_status <> 'Paid';

DELETE FROM public.pending_payments
WHERE id IN ('3d015a82-7fc1-42a6-bbb9-4dca7ad7b532', 'ab1f410d-7f9c-4bd2-88ee-e9c8bea592e4');

-- Verify: exactly one row per grn_no, under the canonical name
SELECT grn_no, vendor_name, party_id, invoice_amount, payment_status
FROM public.pending_payments
WHERE grn_no IN ('2667', '2699')
ORDER BY grn_no;
