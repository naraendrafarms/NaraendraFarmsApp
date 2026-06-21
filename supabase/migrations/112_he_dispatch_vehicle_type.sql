-- Add vehicle type (AC / NON-AC) to HE dispatch
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
