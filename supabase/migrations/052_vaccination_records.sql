CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  shed_id UUID REFERENCES public.sheds(id),
  farm_id UUID REFERENCES public.farms(id),
  vaccine_date DATE NOT NULL,
  vaccine_name TEXT NOT NULL,
  dose_no INTEGER DEFAULT 1,
  route TEXT,              -- drinking_water|eye_drop|injection|spray
  quantity NUMERIC(10,3),
  unit TEXT,
  cost NUMERIC(10,2),
  next_due_date DATE,
  administered_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
