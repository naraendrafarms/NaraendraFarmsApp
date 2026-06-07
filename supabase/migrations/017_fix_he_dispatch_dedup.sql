-- Migration 017: Fix he_dispatch duplicate revenue
-- Root cause: data_dispatch.sql inserted rows with NULL party_id and different prod_dates
-- for the same DC numbers that data_f19/f20_he_dispatch.sql also inserted with correct party_id.
-- The existing UNIQUE constraint (flock_id, dispatch_date, dc_no, prod_date, total_dispatched)
-- did not catch duplicates because prod_date differed between the two sources.
-- Fix: delete rows where party_id IS NULL and a corresponding row with party_id IS NOT NULL
-- exists for the same (flock_id, dc_no, total_dispatched).

DELETE FROM public.he_dispatch a
WHERE a.party_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.he_dispatch b
    WHERE b.flock_id        = a.flock_id
      AND b.dc_no           = a.dc_no
      AND b.total_dispatched = a.total_dispatched
      AND b.party_id        IS NOT NULL
  );

-- Drop old constraint that included prod_date (allows false unique on different prod_dates)
ALTER TABLE public.he_dispatch
  DROP CONSTRAINT IF EXISTS he_dispatch_unique;

-- Add tighter constraint: dc_no + total_dispatched uniquely identifies a dispatch line
-- (same DC can appear multiple times with different totals = split shipments, which is valid)
ALTER TABLE public.he_dispatch
  ADD CONSTRAINT he_dispatch_unique
  UNIQUE (flock_id, dispatch_date, dc_no, total_dispatched);
