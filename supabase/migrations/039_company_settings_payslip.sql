-- Migration 039: Company settings + payslips table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Naraendra Farms',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT DEFAULT 'Andhra Pradesh',
  pincode TEXT,
  phone TEXT,
  email TEXT,
  pan_no TEXT,
  pf_reg_no TEXT,
  esi_reg_no TEXT,
  pt_reg_no TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.company_settings FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

INSERT INTO public.company_settings (company_name, state)
  VALUES ('Naraendra Farms', 'Andhra Pradesh')
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  salary_monthly_id UUID,
  days_worked NUMERIC(5,1),
  basic_salary NUMERIC(12,2) DEFAULT 0,
  hra NUMERIC(12,2) DEFAULT 0,
  da NUMERIC(12,2) DEFAULT 0,
  ta NUMERIC(12,2) DEFAULT 0,
  special_allowance NUMERIC(12,2) DEFAULT 0,
  other_allowance NUMERIC(12,2) DEFAULT 0,
  ot_bonus NUMERIC(12,2) DEFAULT 0,
  arrears NUMERIC(12,2) DEFAULT 0,
  gross_earnings NUMERIC(12,2) DEFAULT 0,
  pf_employee NUMERIC(12,2) DEFAULT 0,
  esi_employee NUMERIC(12,2) DEFAULT 0,
  pt NUMERIC(12,2) DEFAULT 0,
  tds NUMERIC(12,2) DEFAULT 0,
  advance NUMERIC(12,2) DEFAULT 0,
  hold NUMERIC(12,2) DEFAULT 0,
  other_deduction NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) DEFAULT 0,
  pf_employer NUMERIC(12,2) DEFAULT 0,
  esi_employer NUMERIC(12,2) DEFAULT 0,
  remarks TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.payslips FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

NOTIFY pgrst, 'reload schema';
