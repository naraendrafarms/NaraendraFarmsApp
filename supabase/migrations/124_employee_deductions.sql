-- Migration 124: employee_deductions table + nhe_sales employee columns

-- Employee deductions table (tracks items sold to employees on credit)
CREATE TABLE IF NOT EXISTS public.employee_deductions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  nhe_sale_id     UUID REFERENCES public.nhe_sales(id) ON DELETE SET NULL,
  description     TEXT,
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  deduction_month DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  deducted_at     DATE,
  salary_monthly_id UUID,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_ded_employee ON public.employee_deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_ded_month ON public.employee_deductions(deduction_month);
CREATE INDEX IF NOT EXISTS idx_emp_ded_status ON public.employee_deductions(status);

ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_employee_deductions" ON public.employee_deductions TO authenticated USING (true) WITH CHECK (true);

-- Add employee sale columns to nhe_sales
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS is_employee_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE public.nhe_sales ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- Diagnostic
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_deductions') AS tbl_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='nhe_sales' AND column_name='is_employee_sale') AS col_ok;

NOTIFY pgrst, 'reload schema';
