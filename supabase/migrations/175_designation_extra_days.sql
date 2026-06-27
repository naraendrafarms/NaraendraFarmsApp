-- Migration 175: Make extra-days-per-designation editable in-app
-- Replaces hard-coded EG1/EG2 lists in computeSalaryForEmp.

CREATE TABLE IF NOT EXISTS public.designation_extra_days (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  designation     TEXT NOT NULL UNIQUE,
  extra_days_ge15 NUMERIC(4,1) NOT NULL DEFAULT 0,  -- extra days when paid days >= 15
  extra_days_lt15 NUMERIC(4,1) NOT NULL DEFAULT 0,  -- extra days when paid days < 15
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: allow authenticated users (same pattern as config_options)
ALTER TABLE public.designation_extra_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ded_select ON public.designation_extra_days;
CREATE POLICY ded_select ON public.designation_extra_days FOR SELECT USING (true);

DROP POLICY IF EXISTS ded_insert ON public.designation_extra_days;
CREATE POLICY ded_insert ON public.designation_extra_days FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS ded_update ON public.designation_extra_days;
CREATE POLICY ded_update ON public.designation_extra_days FOR UPDATE USING (true);

DROP POLICY IF EXISTS ded_delete ON public.designation_extra_days;
CREATE POLICY ded_delete ON public.designation_extra_days FOR DELETE USING (true);

-- Seed with current hard-coded rules (EG1 = 2/1, EG2 = 1/0)
INSERT INTO public.designation_extra_days (designation, extra_days_ge15, extra_days_lt15) VALUES
  ('MANAGER FINANCE', 2, 1),
  ('ADMINISTRATIVE MANAGER', 2, 1),
  ('ACCOUNTANT', 2, 1),
  ('SITE MANAGER', 2, 1),
  ('STORE KEEPER', 2, 1),
  ('POULTRY ASSISTANT', 2, 1),
  ('ELECTRICIAN', 2, 1),
  ('ASST.SUPERVISOR-MALE', 1, 0),
  ('ASST.SUPERVISOR-FEMALE', 1, 0),
  ('SECURITY-MALE', 1, 0),
  ('DRIVER-MALE', 1, 0),
  ('WORKER-MALE', 1, 0),
  ('WORKER-FEMALE', 1, 0),
  ('MEDIUM VECHICLE DRIVER', 1, 0),
  ('ATTENDER', 1, 0)
ON CONFLICT (designation) DO NOTHING;

-- Verify
SELECT designation, extra_days_ge15, extra_days_lt15 FROM public.designation_extra_days ORDER BY designation;
