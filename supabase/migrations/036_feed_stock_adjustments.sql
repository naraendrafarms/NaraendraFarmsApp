-- Migration 036: Feed stock manual adjustments table
CREATE TABLE IF NOT EXISTS public.feed_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_date DATE NOT NULL,
  ingredient_name TEXT NOT NULL,
  ingredient_code TEXT,
  farm_id UUID REFERENCES public.farms(id),
  adjustment_kg NUMERIC(12,3) NOT NULL,
  adjustment_type TEXT NOT NULL DEFAULT 'Opening',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feed_stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.feed_stock_adjustments FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

NOTIFY pgrst, 'reload schema';
