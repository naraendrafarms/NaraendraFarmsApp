-- Editable minimum-wage floor per skill category (drives the Basic component
-- in the salary auto-split). Values managed in Admin Centre → Employees, NOT hardcoded.
CREATE TABLE IF NOT EXISTS public.skill_wages (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  skill_category TEXT NOT NULL UNIQUE,
  min_wage       NUMERIC NOT NULL DEFAULT 0,
  sort_order     INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the initial categories/values (idempotent)
INSERT INTO public.skill_wages (skill_category, min_wage, sort_order) VALUES
  ('UnSkilled',      14840, 1),
  ('Semi-Skilled',   10850, 2),
  ('Skilled',        11950, 3),
  ('Highly Skilled', 14000, 4)
ON CONFLICT (skill_category) DO NOTHING;

ALTER TABLE public.skill_wages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS skill_wages_all ON public.skill_wages;
CREATE POLICY skill_wages_all ON public.skill_wages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.skill_wages TO authenticated;

-- Diagnostic
SELECT skill_category, min_wage FROM public.skill_wages ORDER BY sort_order;
