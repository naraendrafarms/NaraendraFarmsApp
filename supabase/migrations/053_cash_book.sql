CREATE TABLE IF NOT EXISTS public.cash_book (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  txn_date DATE NOT NULL,
  txn_type TEXT NOT NULL CHECK (txn_type IN ('receipt','payment','contra')),
  category TEXT,  -- sales_collection|expense|salary|advance|transfer|other
  farm_id UUID REFERENCES public.farms(id),
  flock_id UUID REFERENCES public.flocks(id),
  description TEXT NOT NULL,
  party_name TEXT,
  reference_no TEXT,
  amount_in NUMERIC(12,2) DEFAULT 0,
  amount_out NUMERIC(12,2) DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash','upi','cheque')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_book_date ON public.cash_book(txn_date);
ALTER TABLE public.cash_book ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.cash_book FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
NOTIFY pgrst, 'reload schema';
