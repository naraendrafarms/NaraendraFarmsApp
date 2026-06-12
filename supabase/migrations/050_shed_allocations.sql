-- Shed allocations: tracks which flock's birds are in which shed from which date
-- One row per flock+shed assignment event (covers split transfers across multiple sheds)
CREATE TABLE IF NOT EXISTS public.shed_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  shed_id UUID NOT NULL REFERENCES public.sheds(id),
  farm_id UUID REFERENCES public.farms(id),
  allocated_date DATE NOT NULL,
  female_count INTEGER NOT NULL DEFAULT 0,
  male_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add shed_id to daily_records for per-shed production tracking
ALTER TABLE public.daily_records
  ADD COLUMN IF NOT EXISTS shed_id UUID REFERENCES public.sheds(id);

NOTIFY pgrst, 'reload schema';
