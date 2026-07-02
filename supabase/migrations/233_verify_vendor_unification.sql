-- Diagnostic only — verify migration 232 actually backfilled data (no schema changes)
SELECT
  (SELECT count(*) FROM public.parties) AS total_parties,
  (SELECT count(*) FROM public.purchase_orders WHERE party_id IS NULL AND vendor_name IS NOT NULL) AS po_unlinked,
  (SELECT count(*) FROM public.pending_payments WHERE party_id IS NULL AND vendor_name IS NOT NULL) AS pp_unlinked,
  (SELECT count(*) FROM public.parties WHERE bank_name IS NOT NULL) AS parties_with_bank,
  (SELECT count(*) FROM public.purchase_orders WHERE party_id IS NOT NULL) AS po_linked,
  (SELECT count(*) FROM public.pending_payments WHERE party_id IS NOT NULL) AS pp_linked;
