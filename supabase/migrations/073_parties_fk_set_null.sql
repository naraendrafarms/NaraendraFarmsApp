-- Migration 073: Change grn/he_dispatch/nhe_sales party_id FK to ON DELETE SET NULL
-- This allows parties to be deleted even if they have linked GRN or sales records.
-- The linked records will have party_id set to NULL rather than blocking the delete.

ALTER TABLE public.grn
  DROP CONSTRAINT IF EXISTS grn_party_id_fkey,
  ADD CONSTRAINT grn_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;

ALTER TABLE public.he_dispatch
  DROP CONSTRAINT IF EXISTS he_dispatch_party_id_fkey,
  ADD CONSTRAINT he_dispatch_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;

ALTER TABLE public.nhe_sales
  DROP CONSTRAINT IF EXISTS nhe_sales_party_id_fkey,
  ADD CONSTRAINT nhe_sales_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;
