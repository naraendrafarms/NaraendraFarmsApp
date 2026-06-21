-- Add loading/logistics fields to he_dispatch
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS boxes_20lb   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boxes_23lb   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_trays  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lorry_no     TEXT,
  ADD COLUMN IF NOT EXISTS driver_phone TEXT,
  ADD COLUMN IF NOT EXISTS out_time     TEXT;
