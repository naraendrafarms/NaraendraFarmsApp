-- ============================================================
-- NARAENDRA FARMS — COMPLETE SUPABASE SCHEMA v3.0
-- Built from: shed capacity, salary, feed formula, GRN,
--             electricity, flock reports, HE sales, medicine
-- Run entire file in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 1: FARMS & SITES
-- Sites: Kethireddypally (rearing), Agraharam Potlapally (laying),
--        Bodjanampet-1 (laying), Bodjanampet-2 (VHL, laying),
--        Feed Mill (production), Head Office
-- ============================================================

CREATE TABLE IF NOT EXISTS public.farms (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,  -- KPALLY, PPALLY, BPET1, BPET2, FEEDMILL, HO
  name         TEXT NOT NULL,
  site_type    TEXT CHECK (site_type IN ('rearing','laying','feedmill','hatchery','office')) DEFAULT 'laying',
  address      TEXT,
  taluka       TEXT,
  district     TEXT DEFAULT 'Nalgonda',
  state        TEXT DEFAULT 'Telangana',
  contact      TEXT,
  -- Electricity meter numbers (USC codes from bills)
  elec_usc_1   TEXT,   -- Primary meter USC
  elec_usc_2   TEXT,   -- Secondary meter USC (if any)
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Sheds (from Naraendra_Farms_Shed_Capacity_Site_Wise.xlsx)
CREATE TABLE IF NOT EXISTS public.sheds (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farm_id           UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  shed_no           TEXT NOT NULL,
  shed_name         TEXT,
  shed_type         TEXT CHECK (shed_type IN ('brooding','grower','laying','rearing')) DEFAULT 'laying',
  sex               TEXT CHECK (sex IN ('female','male','combined')) DEFAULT 'combined',
  a_side_boxes      INTEGER,
  b_side_boxes      INTEGER,
  total_boxes       INTEGER,
  capacity_female   INTEGER,
  capacity_male     INTEGER,
  birds_per_box     NUMERIC(5,2),
  water_tank_litres INTEGER,
  remarks           TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farm_id, shed_no)
);

-- Electricity meters (multiple per site)
CREATE TABLE IF NOT EXISTS public.electricity_meters (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farm_id     UUID REFERENCES public.farms(id),
  usc_no      TEXT NOT NULL UNIQUE,   -- e.g. 103770716
  service_no  TEXT,                   -- e.g. 381800159
  meter_name  TEXT NOT NULL,          -- e.g. "Bodjanampet-1 Main"
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 2: MASTER TABLES
-- ============================================================

-- Parties (buyers & suppliers)
CREATE TABLE IF NOT EXISTS public.parties (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT CHECK (type IN ('buyer','supplier','both')) DEFAULT 'supplier',
  category     TEXT,   -- HE Buyer, Maize Supplier, Medicine Supplier, Bird Buyer, etc.
  contact      TEXT,
  address      TEXT,
  gstin        TEXT,
  bank_name    TEXT,
  account_no   TEXT,
  ifsc         TEXT,
  credit_days  INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Hatcheries
CREATE TABLE IF NOT EXISTS public.hatcheries (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT CHECK (type IN ('Hitech','VHL','Other')) DEFAULT 'Hitech',
  location   TEXT,
  city       TEXT,
  contact    TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: FEED MILL MASTERS
-- ============================================================

-- Feed ingredients (from Feed_Formula_New_Dr.xlsx + GRN files)
CREATE TABLE IF NOT EXISTS public.feed_ingredients (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code             TEXT UNIQUE,          -- MAIZE, SOYA, DORB, etc.
  name             TEXT NOT NULL,        -- MAIZE-12%Moisture
  short_name       TEXT,                 -- Maize
  category         TEXT CHECK (category IN ('grain','protein','mineral','supplement','additive','other')) DEFAULT 'grain',
  unit             TEXT DEFAULT 'kg',
  protein_pct      NUMERIC(5,2),
  moisture_pct     NUMERIC(5,2),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Feed types / stages (BCM, BGM, BDM, PBM, BL1/L1, BL2/L2, L3, Male)
CREATE TABLE IF NOT EXISTS public.feed_types (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,   -- BCM, BGM, BDM, PBM, L1, L2, L3, MALE
  name        TEXT NOT NULL,          -- Breeder Chick Mash, etc.
  category    TEXT CHECK (category IN ('starter','grower','developer','pre_breeder','layer','male')) DEFAULT 'layer',
  week_from   INTEGER,                -- applicable week start
  week_to     INTEGER,                -- applicable week end
  sex         TEXT CHECK (sex IN ('female','male','both')) DEFAULT 'female',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Feed formulas (from Feed_Formula_New_Dr.xlsx Sheet1/Sheet2)
CREATE TABLE IF NOT EXISTS public.feed_formulas (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feed_type_id    UUID REFERENCES public.feed_types(id),
  ingredient_id   UUID REFERENCES public.feed_ingredients(id),
  qty_per_ton     NUMERIC(10,3) NOT NULL,  -- kg per 1000 kg
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  vet_name        TEXT,   -- Dr name / formula source
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_type_id, ingredient_id, effective_from)
);

-- GRN — Goods Received Note (from GRN_No_S_ALL_SITES.xlsx, Received_Stock files)
CREATE TABLE IF NOT EXISTS public.grn (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grn_no          TEXT NOT NULL,
  grn_date        DATE NOT NULL,
  farm_id         UUID REFERENCES public.farms(id),  -- where received (FEEDMILL, PPALLY, etc.)
  party_id        UUID REFERENCES public.parties(id),
  invoice_no      TEXT,
  invoice_date    DATE,
  ingredient_id   UUID REFERENCES public.feed_ingredients(id),
  item_name       TEXT,           -- raw item name if not in master
  qty             NUMERIC(12,3),
  unit            TEXT DEFAULT 'kg',
  bags            INTEGER,
  price_per_unit  NUMERIC(10,3),
  basic_amount    NUMERIC(14,2),
  gst_pct         NUMERIC(5,2),
  total_amount    NUMERIC(14,2),
  vehicle_no      TEXT,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Feed production batches
CREATE TABLE IF NOT EXISTS public.feed_production (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_date DATE NOT NULL,
  feed_type_id    UUID REFERENCES public.feed_types(id),
  batch_no        TEXT,
  quantity_kg     NUMERIC(12,2) NOT NULL,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Feed production ingredient usage (per batch)
CREATE TABLE IF NOT EXISTS public.feed_production_ingredients (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_id      UUID REFERENCES public.feed_production(id) ON DELETE CASCADE,
  ingredient_id      UUID REFERENCES public.feed_ingredients(id),
  qty_used_kg        NUMERIC(12,3) NOT NULL,
  rate_per_kg        NUMERIC(10,4),
  amount             NUMERIC(14,2),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Feed transfer from feed mill to farms
CREATE TABLE IF NOT EXISTS public.feed_transfers (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transfer_date   DATE NOT NULL,
  from_farm_id    UUID REFERENCES public.farms(id),   -- FEEDMILL
  to_farm_id      UUID REFERENCES public.farms(id),   -- PPALLY, BPET1, etc.
  feed_type_id    UUID REFERENCES public.feed_types(id),
  flock_id        UUID,  -- FK added after flocks table
  quantity_kg     NUMERIC(12,2) NOT NULL,
  vehicle_no      TEXT,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Feed ingredient stock (running balance)
CREATE TABLE IF NOT EXISTS public.ingredient_stock (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ingredient_id   UUID REFERENCES public.feed_ingredients(id) NOT NULL,
  txn_date        DATE NOT NULL,
  txn_type        TEXT CHECK (txn_type IN ('opening','grn','production_use','adjustment','closing')) NOT NULL,
  qty_in          NUMERIC(12,3) DEFAULT 0,
  qty_out         NUMERIC(12,3) DEFAULT 0,
  balance         NUMERIC(12,3),
  rate            NUMERIC(10,4),
  value           NUMERIC(14,2),
  ref_id          UUID,    -- grn.id or feed_production.id
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 4: FLOCKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.flocks (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_no         TEXT NOT NULL UNIQUE,   -- 16, 17, 19, 20, 21...
  breed            TEXT DEFAULT 'VENCO-430',
  rearing_farm_id  UUID REFERENCES public.farms(id),   -- KPALLY
  laying_farm_id   UUID REFERENCES public.farms(id),   -- PPALLY or BPET1
  -- Placement
  placement_date   DATE NOT NULL,
  paid_female      INTEGER NOT NULL,
  paid_male        INTEGER NOT NULL,
  free_female      INTEGER DEFAULT 0,
  free_male        INTEGER DEFAULT 0,
  chick_rate       NUMERIC(8,2) DEFAULT 320,
  supplier         TEXT DEFAULT 'Venkateshwara Hatcheries',
  -- Laying
  laying_start_date DATE,
  -- Status
  status           TEXT CHECK (status IN ('rearing','laying','closed')) DEFAULT 'rearing',
  close_date       DATE,
  -- Computed (updated by trigger)
  total_placed_f   INTEGER GENERATED ALWAYS AS (paid_female + free_female) STORED,
  total_placed_m   INTEGER GENERATED ALWAYS AS (paid_male + free_male) STORED,
  chick_cost       NUMERIC(14,2) GENERATED ALWAYS AS ((paid_female + paid_male) * chick_rate) STORED,
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK back to feed_transfers
ALTER TABLE public.feed_transfers
  ADD CONSTRAINT feed_transfers_flock_fk
  FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE SET NULL;

-- ============================================================
-- SECTION 5: DAILY FLOCK RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_records (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id        UUID REFERENCES public.flocks(id) ON DELETE CASCADE,
  record_date     DATE NOT NULL,
  farm_id         UUID REFERENCES public.farms(id),   -- which site this record is from
  -- Birds
  opening_female  INTEGER,
  opening_male    INTEGER,
  received_female INTEGER DEFAULT 0,   -- birds received (placement day)
  received_male   INTEGER DEFAULT 0,
  trcull_female   INTEGER DEFAULT 0,   -- C13 transfer+cull combined
  trcull_male     INTEGER DEFAULT 0,
  mortality_female INTEGER DEFAULT 0,  -- C15 daily mortality
  mortality_male  INTEGER DEFAULT 0,
  closing_female  INTEGER,
  closing_male    INTEGER,
  -- Feed (kg)
  feed_female_kg  NUMERIC(10,3) DEFAULT 0,
  feed_male_kg    NUMERIC(10,3) DEFAULT 0,
  feed_type_f     TEXT,    -- feed type for female
  feed_type_m     TEXT,    -- feed type for male
  -- Eggs
  total_eggs      INTEGER DEFAULT 0,
  he_eggs         INTEGER DEFAULT 0,
  je_eggs         INTEGER DEFAULT 0,   -- jumbo
  te_eggs         INTEGER DEFAULT 0,   -- table
  be_eggs         INTEGER DEFAULT 0,   -- broken/crack
  le_eggs         INTEGER DEFAULT 0,   -- litter eggs
  -- Light
  lighting_hrs    NUMERIC(4,2),
  age_weeks       NUMERIC(5,1),
  -- Computed
  hd_pct          NUMERIC(6,4) GENERATED ALWAYS AS (
    CASE WHEN opening_female > 0 THEN ROUND(total_eggs::NUMERIC / opening_female, 4) ELSE 0 END
  ) STORED,
  he_pct          NUMERIC(6,4) GENERATED ALWAYS AS (
    CASE WHEN total_eggs > 0 THEN ROUND(he_eggs::NUMERIC / total_eggs, 4) ELSE 0 END
  ) STORED,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id, record_date, farm_id)
);

-- ============================================================
-- SECTION 6: HE DISPATCH & SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.he_dispatch (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id        UUID REFERENCES public.flocks(id),
  dispatch_date   DATE NOT NULL,
  prod_date       DATE,               -- production date of eggs
  dc_no           INTEGER,            -- dispatch challan number
  hatchery_id     UUID REFERENCES public.hatcheries(id),
  party_id        UUID REFERENCES public.parties(id),
  -- Eggs
  grade_a         INTEGER DEFAULT 0,
  grade_b         INTEGER DEFAULT 0,
  total_dispatched INTEGER NOT NULL,
  free_eggs       INTEGER DEFAULT 0,
  invoice_eggs    INTEGER,            -- = total_dispatched - free_eggs
  rate            NUMERIC(8,4),
  amount          NUMERIC(14,2),
  -- Setting chain
  setting_date    DATE,
  hatch_date      DATE,
  chicks_sold     INTEGER,
  hatch_pct       NUMERIC(6,4),
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- NHE Sales (JE, TE, BE, Bird sales, Gas, Manure)
CREATE TABLE IF NOT EXISTS public.nhe_sales (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id      UUID REFERENCES public.flocks(id),
  sale_date     DATE NOT NULL,
  sale_type     TEXT CHECK (sale_type IN ('je','te','be','bird_cull','bird_lame','bird_weak','bird_sex_error','gas','manure','other')) NOT NULL,
  party_id      UUID REFERENCES public.parties(id),
  dc_no         TEXT,
  quantity      NUMERIC(12,3),
  unit          TEXT DEFAULT 'nos',
  rate          NUMERIC(10,4),
  amount        NUMERIC(14,2) NOT NULL,
  remarks       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 7: MEDICINE & VACCINES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.medicines_master (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT CHECK (type IN ('medicine','vaccine','supplement','sanitizer','injectable','disinfectant','pesticide','other')) DEFAULT 'medicine',
  unit          TEXT DEFAULT 'ml',
  manufacturer  TEXT,
  batch_no      TEXT,
  expiry_date   DATE,
  rate          NUMERIC(10,4),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medicine_usage (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id      UUID REFERENCES public.flocks(id),
  usage_date    DATE NOT NULL,
  medicine_id   UUID REFERENCES public.medicines_master(id),
  quantity      NUMERIC(10,3),
  unit          TEXT,
  rate          NUMERIC(10,4),
  amount        NUMERIC(12,2),
  remarks       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly medicine summary (from monthly files R0 C4)
CREATE TABLE IF NOT EXISTS public.medicine_monthly (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id    UUID REFERENCES public.flocks(id),
  month       DATE NOT NULL,  -- first day of month
  total_amount NUMERIC(14,2) NOT NULL,
  remarks     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id, month)
);

-- ============================================================
-- SECTION 8: ELECTRICITY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.electricity_bills (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meter_id        UUID REFERENCES public.electricity_meters(id),
  bill_month      DATE NOT NULL,       -- first day of month
  units_consumed  INTEGER,
  amount          NUMERIC(10,2) NOT NULL,
  acd_dc_due      NUMERIC(10,2) DEFAULT 0,
  deposit_amount  NUMERIC(10,2) DEFAULT 0,
  paid_date       DATE,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meter_id, bill_month)
);

-- Electricity allocation to flocks (computed from bird-proportion / feed-kg)
CREATE TABLE IF NOT EXISTS public.electricity_allocation (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bill_id         UUID REFERENCES public.electricity_bills(id),
  flock_id        UUID REFERENCES public.flocks(id),
  alloc_method    TEXT CHECK (alloc_method IN ('full','bird_proportion','feed_kg_proportion','manual')) DEFAULT 'full',
  alloc_pct       NUMERIC(6,4),
  allocated_amount NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bill_id, flock_id)
);

-- ============================================================
-- SECTION 9: EMPLOYEES & SALARY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  emp_id          TEXT UNIQUE,         -- BPS4008, PPS3528, etc.
  name            TEXT NOT NULL,
  designation     TEXT,
  farm_id         UUID REFERENCES public.farms(id),
  department      TEXT,
  base_salary     NUMERIC(10,2),
  increment       NUMERIC(10,2) DEFAULT 0,
  bank_name       TEXT,
  bank_branch     TEXT,
  account_no      TEXT,
  ifsc            TEXT,
  joining_date    DATE,
  leaving_date    DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salary_monthly (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id     UUID REFERENCES public.employees(id),
  month           DATE NOT NULL,   -- first day of month
  days_worked     NUMERIC(4,1),
  leaves_added    NUMERIC(4,1) DEFAULT 0,
  earned_salary   NUMERIC(10,2),
  advance         NUMERIC(10,2) DEFAULT 0,
  tds             NUMERIC(10,2) DEFAULT 0,
  hold            NUMERIC(10,2) DEFAULT 0,
  arrears         NUMERIC(10,2) DEFAULT 0,
  ot_bonus        NUMERIC(10,2) DEFAULT 0,
  net_salary      NUMERIC(10,2),
  paid_date       DATE,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month)
);

-- Salary abstract (site-wise monthly totals from Abstract sheet)
CREATE TABLE IF NOT EXISTS public.salary_abstract (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farm_id       UUID REFERENCES public.farms(id),
  month         DATE NOT NULL,
  total_salary  NUMERIC(12,2),
  total_advance NUMERIC(12,2) DEFAULT 0,
  total_tds     NUMERIC(12,2) DEFAULT 0,
  net_salary    NUMERIC(12,2),
  employee_count INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farm_id, month)
);

-- Bonus
CREATE TABLE IF NOT EXISTS public.bonus (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id   UUID REFERENCES public.employees(id),
  bonus_year    INTEGER NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  paid_date     DATE,
  remarks       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, bonus_year)
);

-- ============================================================
-- SECTION 10: USERS / AUTH
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role      TEXT CHECK (role IN ('admin','manager','supervisor','data_entry','viewer')) DEFAULT 'viewer',
  farm_id   UUID REFERENCES public.farms(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 11: VIEWS (pre-computed for fast reads → low usage)
-- ============================================================

-- Flock summary view (dashboard cards)
CREATE OR REPLACE VIEW public.v_flock_summary AS
SELECT
  f.id,
  f.flock_no,
  f.breed,
  f.status,
  f.placement_date,
  f.laying_start_date,
  f.total_placed_f,
  f.total_placed_m,
  f.chick_cost,
  rf.name AS rearing_farm,
  lf.name AS laying_farm,
  -- Latest record
  lr.record_date AS last_record_date,
  lr.closing_female AS current_female,
  lr.closing_male AS current_male,
  -- Cumulative production
  COALESCE(ep.total_eggs, 0) AS total_eggs,
  COALESCE(ep.total_he, 0) AS total_he,
  CASE WHEN COALESCE(ep.total_eggs,0) > 0
    THEN ROUND(ep.total_he::NUMERIC/ep.total_eggs,4) ELSE 0 END AS he_pct,
  -- Revenue
  COALESCE(hr.he_revenue, 0) AS he_revenue,
  COALESCE(nr.nhe_revenue, 0) AS nhe_revenue
FROM public.flocks f
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
LEFT JOIN LATERAL (
  SELECT record_date, closing_female, closing_male
  FROM public.daily_records
  WHERE flock_id = f.id
  ORDER BY record_date DESC LIMIT 1
) lr ON true
LEFT JOIN LATERAL (
  SELECT SUM(total_eggs) AS total_eggs, SUM(he_eggs) AS total_he
  FROM public.daily_records WHERE flock_id = f.id
) ep ON true
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS he_revenue
  FROM public.he_dispatch WHERE flock_id = f.id
) hr ON true
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS nhe_revenue
  FROM public.nhe_sales WHERE flock_id = f.id
) nr ON true;

-- Monthly production summary
CREATE OR REPLACE VIEW public.v_monthly_production AS
SELECT
  flock_id,
  DATE_TRUNC('month', record_date) AS month,
  COUNT(*) AS days,
  SUM(total_eggs) AS eggs,
  SUM(he_eggs) AS he,
  SUM(mortality_female) AS mort_f,
  SUM(mortality_male) AS mort_m,
  SUM(feed_female_kg) AS feed_f_kg,
  SUM(feed_male_kg) AS feed_m_kg,
  ROUND(AVG(opening_female)) AS avg_open_f,
  CASE WHEN SUM(total_eggs) > 0
    THEN ROUND(SUM(he_eggs)::NUMERIC / SUM(total_eggs), 4) ELSE 0 END AS he_pct
FROM public.daily_records
GROUP BY flock_id, DATE_TRUNC('month', record_date);

-- ============================================================
-- SECTION 12: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.he_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nhe_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_abstract ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hatcheries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read everything
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_select" ON public.%I', t);
    EXECUTE format('CREATE POLICY "auth_select" ON public.%I FOR SELECT USING (auth.role()=''authenticated'')', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_insert" ON public.%I', t);
    EXECUTE format('CREATE POLICY "auth_insert" ON public.%I FOR INSERT WITH CHECK (auth.role()=''authenticated'')', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_update" ON public.%I', t);
    EXECUTE format('CREATE POLICY "auth_update" ON public.%I FOR UPDATE USING (auth.role()=''authenticated'')', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_delete" ON public.%I', t);
    EXECUTE format('CREATE POLICY "auth_delete" ON public.%I FOR DELETE USING (auth.role()=''authenticated'')', t);
  END LOOP;
END $$;

-- ============================================================
-- SECTION 13: UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER flocks_updated_at BEFORE UPDATE ON public.flocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
