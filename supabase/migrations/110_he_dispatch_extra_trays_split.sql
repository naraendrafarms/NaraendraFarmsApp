-- Split extra_trays into per-box-type: 20LB and 23LB
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS extra_trays_20lb INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_trays_23lb INTEGER DEFAULT 0;
