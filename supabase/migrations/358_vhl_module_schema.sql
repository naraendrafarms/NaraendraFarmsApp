-- Migration 358: VHL contract-flock module — schema.
-- Covers Flock 21 (Bodjanampet-2) today, any future VHL flock/site tomorrow.
-- Kept fully separate from our regular flock tables (daily_records,
-- medicine_usage, items/stock_ledger) so VHL's numbers never mix with, or
-- draw from, our own stock/cost/production data.

-- 1. Tag any flock as a VHL contract flock
ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS is_vhl_contract BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create the Bodjanampet-2 farm properly (was missing entirely)
INSERT INTO public.farms (name, code, type, is_active)
SELECT 'Bodjanampet-2', 'BPET2', 'VHL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.farms WHERE name = 'Bodjanampet-2');

-- 3. Fix Flock 21's dangling farm links + tag it as VHL
UPDATE public.flocks f
SET laying_farm_id = fa.id, rearing_farm_id = fa.id, is_vhl_contract = TRUE
FROM public.farms fa
WHERE f.flock_no = '21' AND fa.name = 'Bodjanampet-2';

-- 4. VHL Daily Entry — same shape as daily_records, fully separate table
CREATE TABLE IF NOT EXISTS public.vhl_daily_entry (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id         UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  record_date      DATE NOT NULL,
  opening_female   INTEGER,
  opening_male     INTEGER,
  received_female  INTEGER DEFAULT 0,
  received_male    INTEGER DEFAULT 0,
  trcull_female    INTEGER DEFAULT 0,
  trcull_male      INTEGER DEFAULT 0,
  mortality_female INTEGER DEFAULT 0,
  mortality_male   INTEGER DEFAULT 0,
  closing_female   INTEGER,
  closing_male     INTEGER,
  feed_female_kg   NUMERIC(10,3) DEFAULT 0,
  feed_male_kg     NUMERIC(10,3) DEFAULT 0,
  feed_type_f      TEXT,
  feed_type_m      TEXT,
  total_eggs       INTEGER DEFAULT 0,
  he_eggs          INTEGER DEFAULT 0,
  je_eggs          INTEGER DEFAULT 0,
  te_eggs          INTEGER DEFAULT 0,
  be_eggs          INTEGER DEFAULT 0,
  le_eggs          INTEGER DEFAULT 0,
  lighting_hrs     NUMERIC(4,2),
  age_weeks        NUMERIC(5,1),
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id, record_date)
);

-- 5. VHL Medicine Master — fully separate from our unified `items` table
CREATE TABLE IF NOT EXISTS public.vhl_medicines (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  unit       TEXT DEFAULT 'ml',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VHL Medicine Usage Log — record-only, never touches our stock_ledger
CREATE TABLE IF NOT EXISTS public.vhl_medicine_usage (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id        UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  vhl_medicine_id UUID REFERENCES public.vhl_medicines(id),
  usage_date      DATE NOT NULL,
  quantity        NUMERIC(10,3),
  unit            TEXT,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VHL egg rate — effective-dated, same pattern as HE Rate Register, since
--    the ₹4.30/egg rate is expected to change over time.
CREATE TABLE IF NOT EXISTS public.vhl_egg_rate_history (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  effective_date DATE NOT NULL UNIQUE,
  rate_per_egg   NUMERIC(10,4) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.vhl_egg_rate_history (effective_date, rate_per_egg)
SELECT '2025-04-10', 4.30
WHERE NOT EXISTS (SELECT 1 FROM public.vhl_egg_rate_history);

-- 8. VHL Egg Production — daily dispatch entry, monthly invoice via invoice_no
--    (same daily-dispatch/month-end-invoice pattern as the Site Invoice page).
CREATE TABLE IF NOT EXISTS public.vhl_egg_production (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id         UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  production_date  DATE NOT NULL,
  he_qty           INTEGER DEFAULT 0,
  te_qty           INTEGER DEFAULT 0,
  rate_per_egg     NUMERIC(10,4) NOT NULL,
  amount           NUMERIC(12,2) NOT NULL,
  dc_no            TEXT,
  vehicle_no       TEXT,
  invoice_no       TEXT,
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id, production_date)
);

-- RLS — same authenticated-all pattern used across the app
ALTER TABLE public.vhl_daily_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vhl_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vhl_medicine_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vhl_egg_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vhl_egg_production ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vhl_daily_entry' AND policyname='vhl_daily_entry_all') THEN
    CREATE POLICY vhl_daily_entry_all ON public.vhl_daily_entry FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vhl_medicines' AND policyname='vhl_medicines_all') THEN
    CREATE POLICY vhl_medicines_all ON public.vhl_medicines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vhl_medicine_usage' AND policyname='vhl_medicine_usage_all') THEN
    CREATE POLICY vhl_medicine_usage_all ON public.vhl_medicine_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vhl_egg_rate_history' AND policyname='vhl_egg_rate_history_all') THEN
    CREATE POLICY vhl_egg_rate_history_all ON public.vhl_egg_rate_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vhl_egg_production' AND policyname='vhl_egg_production_all') THEN
    CREATE POLICY vhl_egg_production_all ON public.vhl_egg_production FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Verify
SELECT flock_no, is_vhl_contract, laying_farm_id, rearing_farm_id FROM public.flocks WHERE flock_no = '21';
SELECT name, code, type FROM public.farms WHERE name = 'Bodjanampet-2';
