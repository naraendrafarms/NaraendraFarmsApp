-- TDS Payable report joins pending_payments to parties via
-- `parties!party_id(...)` (PostgREST embed syntax), but migration 133 added
-- pending_payments.party_id with NO foreign key constraint ("just a
-- reference hint for PostgREST"). PostgREST can only resolve an embed like
-- this against a real FK in the schema cache — without one the whole query
-- errors out, so the Vendor TDS table showed nothing at all.
-- Null out any orphaned party_id first (same guard used in migrations
-- 341/342) so the ADD CONSTRAINT doesn't fail.
UPDATE public.pending_payments p
SET party_id = NULL
WHERE p.party_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.parties pa WHERE pa.id = p.party_id);

ALTER TABLE public.pending_payments DROP CONSTRAINT IF EXISTS pending_payments_party_id_fkey;
ALTER TABLE public.pending_payments
  ADD CONSTRAINT pending_payments_party_id_fkey
  FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;

SELECT count(*) AS constraint_exists FROM information_schema.table_constraints
WHERE table_name = 'pending_payments' AND constraint_name = 'pending_payments_party_id_fkey';
