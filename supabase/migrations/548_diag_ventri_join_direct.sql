-- Diagnostic only (no schema changes) — user pushed back: the Bank Ledger
-- UI's Edit modal DOES show "Linked to bill" with full vendor/invoice/GRN
-- details for this exact transaction, meaning its linked_payment_id
-- resolves live via a direct .eq('id', linked_payment_id) lookup — which
-- contradicts my last diagnostic (546) that queried a hand-copied UUID and
-- got 0 rows. Redoing this as one single JOIN straight off the bank
-- transaction row itself, no manually copied id, to remove any chance of
-- transcription error.
SELECT bt.id AS txn_id, bt.amount AS txn_amount, bt.linked_payment_id,
  pp.id AS bill_id, pp.vendor_name, pp.invoice_no, pp.grn_no,
  pp.invoice_amount, pp.net_payable, pp.discount_amount, pp.paid_amount, pp.payment_status
FROM public.bank_transactions bt
LEFT JOIN public.pending_payments pp ON pp.id = bt.linked_payment_id
WHERE bt.reference_no = 'CMS1272699630807' AND bt.txn_date = '2026-05-07'
  AND bt.description ILIKE '%203%';

SELECT 'sentinel' AS marker, 1 AS n;
