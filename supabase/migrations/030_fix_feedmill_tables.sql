-- Migration 030: Fix Feed Mill tables — rename old feed_formulas, add correct schema + RLS

-- ── 1. Rename old feed_formulas (different schema) to avoid conflict ─────────
ALTER TABLE IF EXISTS public.feed_formulas RENAME TO feed_formulas_legacy;

-- ── 2. Create correct feed_formulas table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_formulas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  formula_code TEXT NOT NULL,
  formula_name TEXT NOT NULL,
  flock_type TEXT DEFAULT 'Breeder',
  age_week_from NUMERIC(5,1),
  age_week_to NUMERIC(5,1),
  version INTEGER DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. feed_formula_ingredients (created in 028, may already exist) ──────────
CREATE TABLE IF NOT EXISTS public.feed_formula_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  formula_id UUID NOT NULL REFERENCES public.feed_formulas(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  ingredient_code TEXT,
  percentage NUMERIC(8,4) NOT NULL DEFAULT 0,
  kg_per_1000 NUMERIC(10,3),
  sort_order INTEGER DEFAULT 0
);

-- ── 4. feed_production_log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_production_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_date DATE NOT NULL,
  formula_id UUID REFERENCES public.feed_formulas(id),
  farm_id UUID REFERENCES public.farms(id),
  quantity_kg NUMERIC(12,3) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. feed_production_ingredients ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_production_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_id UUID NOT NULL REFERENCES public.feed_production_log(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_kg NUMERIC(12,3) NOT NULL
);

-- ── 6. feedmill_expenses ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedmill_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  farm_id UUID REFERENCES public.farms(id),
  vendor_name TEXT,
  invoice_no TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. vaccination_schedule ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vaccination_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_name TEXT NOT NULL DEFAULT 'Narendra Breeder',
  sno INTEGER,
  age_label TEXT,
  vaccine_name TEXT NOT NULL,
  dose TEXT,
  route TEXT,
  product TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.feed_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_formula_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_production_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_production_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedmill_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.feed_formulas FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.feed_formula_ingredients FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.feed_production_log FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.feed_production_ingredients FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.feedmill_expenses FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.vaccination_schedule FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

-- ── 9. Seed all 7 Narendra Breeder formulas ──────────────────────────────────

INSERT INTO public.feed_formulas (formula_code, formula_name, flock_type, age_week_from, age_week_to, version, notes) VALUES
  ('PS-NB',  'Starter (0–7th week)',               'Breeder', 0,    7,    3, 'Use from 0–6th week of age'),
  ('P1-NB',  'Grower (7th–15th week)',              'Breeder', 7,    15,   3, NULL),
  ('PBDR',   'Developer (16th week–5% production)', 'Breeder', 16,   NULL, 3, '16th week to 5% production'),
  ('PL3-N',  'Layer Phase 3 (5%–35th week)',        'Breeder', NULL, NULL, 3, '5% production to 35th week'),
  ('PL4-N',  'Layer Phase 4 (36th–50th week)',      'Breeder', NULL, NULL, 3, '36th to 50th week'),
  ('PL5-N',  'Layer Phase 5 (51st week–culling)',   'Breeder', NULL, NULL, 3, '51st week to cullings'),
  ('PL6-N',  'Male Feed Formulation',               'Breeder', NULL, NULL, 3, 'Male feed');

-- PS-NB ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PS-NB' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',67.3,673.91,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',20,200.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',3,30.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',2,20.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',1,10.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1,10.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.2,12.00,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',1.6,16.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.15,1.50,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.1,1.00,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','COCCIDIOSTAT',0.05,0.50,19),
  ((SELECT id FROM f),'30','PROBIOTIC',0.05,0.50,20),
  ((SELECT id FROM f),'31','PHYTASE',0.01,0.10,21),
  ((SELECT id FROM f),'32','XYLANASE',0.01,0.10,22),
  ((SELECT id FROM f),'33','VIT-C',0.03,0.30,23),
  ((SELECT id FROM f),'34','ANTI-OXIDANT',0.01,0.10,24),
  ((SELECT id FROM f),'35','COLOUR (MARIGOLD)',0.04,0.40,25);

-- P1-NB ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='P1-NB' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',65,650.00,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',18,180.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',5,50.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',1.5,15.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',1,10.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1,10.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.3,13.00,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',4,40.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.2,2.00,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.1,1.00,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','COCCIDIOSTAT',0.05,0.50,19),
  ((SELECT id FROM f),'30','PROBIOTIC',0.05,0.50,20),
  ((SELECT id FROM f),'31','PHYTASE',0.01,0.10,21),
  ((SELECT id FROM f),'32','XYLANASE',0.01,0.10,22),
  ((SELECT id FROM f),'33','VIT-C',0.03,0.30,23),
  ((SELECT id FROM f),'34','ANTI-OXIDANT',0.01,0.10,24),
  ((SELECT id FROM f),'35','COLOUR (MARIGOLD)',0.04,0.40,25),
  ((SELECT id FROM f),'36','GROWTH PROMOTER',0.05,0.50,26);

-- PBDR ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PBDR' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',62,620.00,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',16,160.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',6,60.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',1,10.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',1,10.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1,10.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.35,13.50,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',8,80.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.2,2.00,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.1,1.00,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','PHYTASE',0.01,0.10,19),
  ((SELECT id FROM f),'30','XYLANASE',0.01,0.10,20),
  ((SELECT id FROM f),'31','VIT-C',0.03,0.30,21),
  ((SELECT id FROM f),'32','ANTI-OXIDANT',0.01,0.10,22),
  ((SELECT id FROM f),'33','COLOUR (MARIGOLD)',0.04,0.40,23),
  ((SELECT id FROM f),'34','PROBIOTIC',0.05,0.50,24),
  ((SELECT id FROM f),'35','TOXIN BINDER-2',0.1,1.00,25),
  ((SELECT id FROM f),'36','GROWTH PROMOTER',0.05,0.50,26);

-- PL3-N ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PL3-N' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',58,580.00,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',14,140.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',5,50.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',2,20.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',2,20.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1.5,15.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.35,13.50,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',12,120.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.25,2.50,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.15,1.50,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','PHYTASE',0.01,0.10,19),
  ((SELECT id FROM f),'30','XYLANASE',0.01,0.10,20),
  ((SELECT id FROM f),'31','VIT-C',0.03,0.30,21),
  ((SELECT id FROM f),'32','ANTI-OXIDANT',0.01,0.10,22),
  ((SELECT id FROM f),'33','COLOUR (MARIGOLD)',0.04,0.40,23),
  ((SELECT id FROM f),'34','PROBIOTIC',0.05,0.50,24),
  ((SELECT id FROM f),'35','SELENIUM',0.01,0.10,25),
  ((SELECT id FROM f),'36','VIT-E',0.03,0.30,26),
  ((SELECT id FROM f),'37','BIOTIN',0.01,0.10,27),
  ((SELECT id FROM f),'38','GROWTH PROMOTER',0.05,0.50,28);

-- PL4-N ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PL4-N' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',56,560.00,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',13,130.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',5,50.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',2,20.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',2,20.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1.5,15.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.35,13.50,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',14.5,145.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.25,2.50,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.15,1.50,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','PHYTASE',0.01,0.10,19),
  ((SELECT id FROM f),'30','XYLANASE',0.01,0.10,20),
  ((SELECT id FROM f),'31','VIT-C',0.03,0.30,21),
  ((SELECT id FROM f),'32','ANTI-OXIDANT',0.01,0.10,22),
  ((SELECT id FROM f),'33','COLOUR (MARIGOLD)',0.04,0.40,23),
  ((SELECT id FROM f),'34','PROBIOTIC',0.05,0.50,24),
  ((SELECT id FROM f),'35','SELENIUM',0.01,0.10,25),
  ((SELECT id FROM f),'36','VIT-E',0.03,0.30,26),
  ((SELECT id FROM f),'37','BIOTIN',0.01,0.10,27),
  ((SELECT id FROM f),'38','GROWTH PROMOTER',0.05,0.50,28);

-- PL5-N ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PL5-N' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',54,540.00,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',12,120.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',5,50.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',2,20.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',2,20.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1.5,15.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.35,13.50,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',16.5,165.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.25,2.50,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.15,1.50,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','PHYTASE',0.01,0.10,19),
  ((SELECT id FROM f),'30','XYLANASE',0.01,0.10,20),
  ((SELECT id FROM f),'31','VIT-C',0.03,0.30,21),
  ((SELECT id FROM f),'32','ANTI-OXIDANT',0.01,0.10,22),
  ((SELECT id FROM f),'33','COLOUR (MARIGOLD)',0.04,0.40,23),
  ((SELECT id FROM f),'34','PROBIOTIC',0.05,0.50,24),
  ((SELECT id FROM f),'35','SELENIUM',0.01,0.10,25),
  ((SELECT id FROM f),'36','VIT-E',0.03,0.30,26),
  ((SELECT id FROM f),'37','BIOTIN',0.01,0.10,27),
  ((SELECT id FROM f),'38','GROWTH PROMOTER',0.05,0.50,28);

-- PL6-N Male Feed ingredients
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PL6-N' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f),'11','MAIZE-12%Moisture',60,600.00,1),
  ((SELECT id FROM f),'12','SOYA-DOC-46%',15,150.00,2),
  ((SELECT id FROM f),'13','RICE-POLISH',7,70.00,3),
  ((SELECT id FROM f),'14','FISH-MEAL-60%',1,10.00,4),
  ((SELECT id FROM f),'15','MEAT & BONE MEAL',1,10.00,5),
  ((SELECT id FROM f),'16','VEGETABLE FAT',1,10.00,6),
  ((SELECT id FROM f),'17','DI-CAL-PHOSPHATE',1.35,13.50,7),
  ((SELECT id FROM f),'18','LIME STONE POWDER',10,100.00,8),
  ((SELECT id FROM f),'19','COMMON SALT',0.35,3.50,9),
  ((SELECT id FROM f),'20','SODIUM BICARBONATE',0.1,1.00,10),
  ((SELECT id FROM f),'21','CHOLINE CHLORIDE-60%',0.1,1.00,11),
  ((SELECT id FROM f),'22','LYSINE',0.1,1.00,12),
  ((SELECT id FROM f),'23','METHIONINE',0.2,2.00,13),
  ((SELECT id FROM f),'24','THREONINE',0.05,0.50,14),
  ((SELECT id FROM f),'25','VITAMIN PREMIX',0.1,1.00,15),
  ((SELECT id FROM f),'26','MINERAL PREMIX',0.1,1.00,16),
  ((SELECT id FROM f),'27','TOXIN BINDER',0.1,1.00,17),
  ((SELECT id FROM f),'28','ENZYME',0.05,0.50,18),
  ((SELECT id FROM f),'29','PHYTASE',0.01,0.10,19),
  ((SELECT id FROM f),'30','XYLANASE',0.01,0.10,20),
  ((SELECT id FROM f),'31','VIT-C',0.03,0.30,21),
  ((SELECT id FROM f),'32','ANTI-OXIDANT',0.01,0.10,22),
  ((SELECT id FROM f),'33','COLOUR (MARIGOLD)',0.04,0.40,23),
  ((SELECT id FROM f),'34','PROBIOTIC',0.05,0.50,24),
  ((SELECT id FROM f),'35','GROWTH PROMOTER',0.05,0.50,25);
