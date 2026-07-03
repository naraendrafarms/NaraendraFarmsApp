-- The only orphaned FK found in the live-database audit: pending_payments
-- row for "Sri Santhosh Southern Minerals" (invoice 33) points at a
-- party_id whose parties row no longer exists (likely deleted during a
-- past party cleanup/merge). vendor_name is stored as its own text column
-- and is untouched by this — nulling party_id only removes a dangling
-- reference so the row stops silently failing any future party-based join,
-- with zero visible change to the bill itself.
UPDATE public.pending_payments
SET party_id = NULL
WHERE id = '2b7b4c61-bc65-4281-8203-8bef10273060'
  AND party_id = '4d6c8d75-d01c-434e-8cf2-649dcd0c684e';

SELECT id, vendor_name, party_id FROM public.pending_payments WHERE id = '2b7b4c61-bc65-4281-8203-8bef10273060';
