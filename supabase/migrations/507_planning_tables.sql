-- Planning: Upcoming Flock Cost Projection + Quarterly Budget/Cash Flow Forecast.
-- Both features share one schema: a `plans` header + `plan_lines` detail rows,
-- each with a `variant` of 'generated' (system-computed, saved as a frozen
-- snapshot so later variance reports stay honest) or 'manual' (owner-entered
-- assumptions/budget — independent of the generated view, not derived from it).

CREATE TABLE IF NOT EXISTS public.plans (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_type           TEXT NOT NULL CHECK (plan_type IN ('flock_projection','quarterly_budget')),
  variant             TEXT NOT NULL CHECK (variant IN ('generated','manual')),
  title               TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','superseded')),
  -- Flock Cost Projection fields
  farm_id             UUID REFERENCES public.farms(id),
  breed               TEXT,
  placement_date      DATE,
  planned_female      INTEGER,
  planned_male        INTEGER,
  reference_flock_ids UUID[],
  -- Quarterly Budget fields
  period_year         INTEGER,
  period_quarter      INTEGER CHECK (period_quarter BETWEEN 1 AND 4),
  opening_balance      NUMERIC(14,2),
  -- Shared
  price_basis         TEXT,   -- free-text note: which feed/egg rate basis was used
  notes               TEXT,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plan_lines (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id       UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  period_label  TEXT NOT NULL,   -- e.g. 'W1'..'W72' age-week for flock projection, '2026-08' month for budget
  category       TEXT,           -- cost head (chick/feed/medicine/labour/overhead/revenue) or cash_book category
  flow          TEXT CHECK (flow IN ('in','out')),
  qty           NUMERIC(14,3),
  rate          NUMERIC(14,4),
  amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_lines_plan ON public.plan_lines(plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_type_status ON public.plans(plan_type, status);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select" ON public.plans FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_insert" ON public.plans FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_update" ON public.plans FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY "auth_delete" ON public.plans FOR DELETE USING (auth.role()='authenticated');
CREATE POLICY "auth_select" ON public.plan_lines FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_insert" ON public.plan_lines FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_update" ON public.plan_lines FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY "auth_delete" ON public.plan_lines FOR DELETE USING (auth.role()='authenticated');
