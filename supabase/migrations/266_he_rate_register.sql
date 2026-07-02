-- Hatching Egg weekly Association rate register (declared Friday, effective
-- Sunday-Saturday) + STD (standard) production % benchmark curve for
-- Summer Laying vs Winter Laying flocks (a separate, unrelated concept from
-- pricing — a target production-performance chart by week of age).

CREATE TABLE IF NOT EXISTS public.he_rate_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,   -- Sunday
  week_end   DATE NOT NULL,          -- Saturday
  rate NUMERIC(8,2) NOT NULL,
  declared_date DATE,                -- usually the Friday before week_start
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.he_rate_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.he_rate_register FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS laying_season TEXT CHECK (laying_season IN ('Summer','Winter'));

CREATE TABLE IF NOT EXISTS public.std_production_curve (
  season TEXT NOT NULL CHECK (season IN ('Summer','Winter')),
  week_of_age INTEGER NOT NULL,
  std_production_pct NUMERIC(5,2) NOT NULL,
  PRIMARY KEY (season, week_of_age)
);
ALTER TABLE public.std_production_curve ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.std_production_curve FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

NOTIFY pgrst, 'reload schema';
SELECT 'ok' AS chk;
