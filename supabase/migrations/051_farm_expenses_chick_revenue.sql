-- Farm operational expenses: maintenance, transport, water, fuel, admin, other
CREATE TABLE IF NOT EXISTS public.farm_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL,
  farm_id UUID REFERENCES public.farms(id),
  flock_id UUID REFERENCES public.flocks(id),
  category TEXT NOT NULL,           -- maintenance|transport|water|fuel|insurance|admin|other
  description TEXT NOT NULL,
  vendor TEXT,
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT,                -- cash|bank|credit
  reference_no TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chick sale revenue on hatch batches (previously only quantity stored)
ALTER TABLE public.hatch_batches
  ADD COLUMN IF NOT EXISTS chick_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS chick_amount NUMERIC(12,2);

NOTIFY pgrst, 'reload schema';
