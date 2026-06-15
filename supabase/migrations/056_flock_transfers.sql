CREATE TABLE IF NOT EXISTS public.flock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_id UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  transfer_date DATE NOT NULL,
  from_farm_id UUID REFERENCES public.farms(id),
  to_farm_id UUID NOT NULL REFERENCES public.farms(id),
  from_shed_id UUID REFERENCES public.sheds(id),
  to_shed_id UUID REFERENCES public.sheds(id),
  female_count INTEGER DEFAULT 0,
  male_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.flock_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.flock_transfers FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
NOTIFY pgrst, 'reload schema';
