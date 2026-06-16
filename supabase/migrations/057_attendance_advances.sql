-- Daily attendance records (P/A/H/WO/OT per employee per day)
CREATE TABLE IF NOT EXISTS public.attendance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id),
  attendance_date DATE NOT NULL,
  status VARCHAR(2) NOT NULL DEFAULT 'P' CHECK (status IN ('P','A','H','WO','OT')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);
ALTER TABLE public.attendance_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.attendance_daily FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

-- Employee advances (cash, egg, or other) linked to a salary month
CREATE TABLE IF NOT EXISTS public.employee_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id),
  advance_date DATE NOT NULL,
  advance_type VARCHAR(10) NOT NULL DEFAULT 'cash' CHECK (advance_type IN ('cash','egg','other')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  egg_qty INTEGER,
  egg_rate NUMERIC(8,2),
  narration TEXT,
  salary_month VARCHAR(7),  -- YYYY-MM: which month to deduct from
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.employee_advances FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

NOTIFY pgrst, 'reload schema';
