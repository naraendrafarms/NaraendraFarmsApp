-- Migration 028: Feed Mill — formulas, production log, expenses

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

CREATE TABLE IF NOT EXISTS public.feed_formula_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  formula_id UUID NOT NULL REFERENCES public.feed_formulas(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  ingredient_code TEXT,
  percentage NUMERIC(8,4) NOT NULL DEFAULT 0,
  kg_per_1000 NUMERIC(10,3),
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.feed_production_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_date DATE NOT NULL,
  formula_id UUID REFERENCES public.feed_formulas(id),
  farm_id UUID REFERENCES public.farms(id),
  quantity_kg NUMERIC(12,3) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feed_production_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_id UUID NOT NULL REFERENCES public.feed_production_log(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_kg NUMERIC(12,3) NOT NULL
);

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

-- ── Seed current Narendra Breeder formulas ───────────────────────

INSERT INTO public.feed_formulas (formula_code, formula_name, flock_type, age_week_from, age_week_to, version, notes)
VALUES
  ('PS-NB',  'Starter (0–7th week)',               'Breeder', 0,    7,    3, 'Use from 0–6th week of age'),
  ('P1-NB',  'Grower (7th–15th week)',              'Breeder', 7,    15,   5, 'From 7th week to 15th week of age'),
  ('PBDR',   'Pre-Breeder (16th week to 5% prod)', 'Breeder', 16,   NULL, 5, 'From 16th week to 5% production')
ON CONFLICT DO NOTHING;

-- PS-NB ingredients (0–7th week)
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PS-NB' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f), '11',   'MAIZE-12%Moisture',                    67.3,  673.91, 1),
  ((SELECT id FROM f), '24',   'SOYA DOC-(46%CP)',                     28.1,  281.12, 2),
  ((SELECT id FROM f), '31',   'DORB-17% Protein',                     0.77,  7.67,   3),
  ((SELECT id FROM f), '41',   'L SP-36.50%-Calcium-Gaurika',          1.20,  12.05,  4),
  ((SELECT id FROM f), '51',   'SALT-(Ankur)',                         0.23,  2.30,   5),
  ((SELECT id FROM f), '55',   'DLM/Rhod NP99',                        0.18,  1.81,   6),
  ((SELECT id FROM f), '56',   'SODA BICARB-Tata food grade',          0.21,  2.06,   7),
  ((SELECT id FROM f), '60',   'Toxifin-360Dry(Kemin)',                0.13,  1.25,   8),
  ((SELECT id FROM f), '63',   'Phygest-10000-(Kemin)',                0.01,  0.10,   9),
  ((SELECT id FROM f), '77',   'Choline Chl-60%-(Jubliant/Balaji)',    0.10,  1.00,   10),
  ((SELECT id FROM f), '78',   'Kemzyme Protease-(Kemin)',             0.03,  0.25,   11),
  ((SELECT id FROM f), '82',   'Saf-Manans (Phileo)',                  0.03,  0.25,   12),
  ((SELECT id FROM f), '95',   'Breed Vitami-0.10%-Trow/DSM/Adiss',   0.10,  1.00,   13),
  ((SELECT id FROM f), '101',  'NEOLINC-Ravioza (L10+N10%)',           0.02,  0.20,   14),
  ((SELECT id FROM f), '163',  'AMINO-GABA-20% (CPBIO)',               0.03,  0.25,   15),
  ((SELECT id FROM f), '181',  'Vit-C-98%(Ayugen)',                    0.02,  0.15,   16),
  ((SELECT id FROM f), '238',  'Breeder In-TM-Avitech(Avimin)',        0.10,  1.00,   17),
  ((SELECT id FROM f), '301',  'Oregostim-1X-Saife-Vet',              0.03,  0.25,   18),
  ((SELECT id FROM f), '302',  'MCP-22%-Phos',                         1.08,  10.81,  19),
  ((SELECT id FROM f), '400',  '40 degree-Sunways',                    0.08,  0.75,   20),
  ((SELECT id FROM f), '0001', 'Kemtrace Supreme-Kemin',               0.05,  0.50,   21),
  ((SELECT id FROM f), '91.5', 'Vitamin-E-50%Rovimix',                 0.02,  0.15,   22),
  ((SELECT id FROM f), '91.9', 'Buti Pearl(Kemin)',                    0.05,  0.50,   23),
  ((SELECT id FROM f), '92.5', 'Hepatocare(Versa)',                    0.05,  0.50,   24),
  ((SELECT id FROM f), '92.9', 'Endox-T Dry',                         0.02,  0.18,   25);

-- P1-NB ingredients (7th–15th week)
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='P1-NB' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f), '11',   'MAIZE-12%Moisture',                    69.8,  698.03, 1),
  ((SELECT id FROM f), '24',   'SOYA DOC-(46%CP)',                     10.4,  104.87, 2),
  ((SELECT id FROM f), '31',   'DORB-17% Protein',                     16.0,  160.65, 3),
  ((SELECT id FROM f), '41',   'L SP-36.50%-Calcium-Gaurika',          1.40,  14.02,  4),
  ((SELECT id FROM f), '51',   'SALT-(Ankur)',                         0.22,  2.20,   5),
  ((SELECT id FROM f), '54',   'L-LYSINE-78%',                         0.01,  0.14,   6),
  ((SELECT id FROM f), '55',   'DLM/Rhod NP99',                        0.05,  0.45,   7),
  ((SELECT id FROM f), '56',   'SODA BICARB-Tata food grade',          0.19,  1.90,   8),
  ((SELECT id FROM f), '60',   'Toxifin-360Dry(Kemin)',                0.13,  1.25,   9),
  ((SELECT id FROM f), '63',   'Phygest-10000-(Kemin)',                0.01,  0.10,   10),
  ((SELECT id FROM f), '77',   'Choline Chl-60%-(Jubliant/Balaji)',    0.12,  1.21,   11),
  ((SELECT id FROM f), '78',   'Kemzyme Protease-(Kemin)',             0.03,  0.25,   12),
  ((SELECT id FROM f), '82',   'Saf-Manans (Phileo)',                  0.03,  0.25,   13),
  ((SELECT id FROM f), '95',   'Breed Vitami-0.10%-Trow/DSM/Adiss',   0.10,  1.00,   14),
  ((SELECT id FROM f), '101',  'NEOLINC-Ravioza (L10+N10%)',           0.02,  0.20,   15),
  ((SELECT id FROM f), '163',  'AMINO-GABA-20% (CPBIO)',               0.03,  0.25,   16),
  ((SELECT id FROM f), '181',  'Vit-C-98%(Ayugen)',                    0.02,  0.15,   17),
  ((SELECT id FROM f), '238',  'Breeder In-TM-Avitech(Avimin)',        0.10,  1.00,   18),
  ((SELECT id FROM f), '301',  'Oregostim-1X-Saife-Vet',              0.03,  0.25,   19),
  ((SELECT id FROM f), '302',  'MCP-22%-Phos',                         0.92,  9.24,   20),
  ((SELECT id FROM f), '400',  '40 degree-Sunways',                    0.08,  0.75,   21),
  ((SELECT id FROM f), '0001', 'Kemtrace Supreme-Kemin',               0.05,  0.50,   22),
  ((SELECT id FROM f), '91.5', 'Vitamin-E-50%Rovimix',                 0.02,  0.15,   23),
  ((SELECT id FROM f), '91.9', 'Buti Pearl(Kemin)',                    0.05,  0.50,   24),
  ((SELECT id FROM f), '92.5', 'Hepatocare(Versa)',                    0.05,  0.50,   25),
  ((SELECT id FROM f), '92.9', 'Endox-T Dry',                         0.02,  0.18,   26);

-- PBDR ingredients (16th week to 5% prod)
WITH f AS (SELECT id FROM public.feed_formulas WHERE formula_code='PBDR' LIMIT 1)
INSERT INTO public.feed_formula_ingredients (formula_id, ingredient_code, ingredient_name, percentage, kg_per_1000, sort_order) VALUES
  ((SELECT id FROM f), '11',   'MAIZE-12%Moisture',                    73.3,  733.47, 1),
  ((SELECT id FROM f), '24',   'SOYA DOC-(46%CP)',                     14.4,  144.39, 2),
  ((SELECT id FROM f), '31',   'DORB-17% Protein',                     6.69,  66.90,  3),
  ((SELECT id FROM f), '41',   'L SP-36.50%-Calcium-Gaurika',          3.10,  30.96,  4),
  ((SELECT id FROM f), '51',   'SALT-(Ankur)',                         0.22,  2.16,   5),
  ((SELECT id FROM f), '54',   'L-LYSINE-78%',                         0.04,  0.43,   6),
  ((SELECT id FROM f), '55',   'DLM/Rhod NP99',                        0.07,  0.75,   7),
  ((SELECT id FROM f), '56',   'SODA BICARB-Tata food grade',          0.21,  2.12,   8),
  ((SELECT id FROM f), '60',   'Toxifin-360Dry(Kemin)',                0.13,  1.25,   9),
  ((SELECT id FROM f), '63',   'Phygest-10000-(Kemin)',                0.01,  0.10,   10),
  ((SELECT id FROM f), '77',   'Choline Chl-60%-(Jubliant/Balaji)',    0.12,  1.18,   11),
  ((SELECT id FROM f), '78',   'Kemzyme Protease-(Kemin)',             0.03,  0.25,   12),
  ((SELECT id FROM f), '82',   'Saf-Manans (Phileo)',                  0.03,  0.25,   13),
  ((SELECT id FROM f), '95',   'Breed Vitami-0.10%-Trow/DSM/Adiss',   0.10,  1.00,   14),
  ((SELECT id FROM f), '101',  'NEOLINC-Ravioza (L10+N10%)',           0.02,  0.20,   15),
  ((SELECT id FROM f), '163',  'AMINO-GABA-20% (CPBIO)',               0.03,  0.25,   16),
  ((SELECT id FROM f), '181',  'Vit-C-98%(Ayugen)',                    0.02,  0.15,   17),
  ((SELECT id FROM f), '238',  'Breeder In-TM-Avitech(Avimin)',        0.10,  1.00,   18),
  ((SELECT id FROM f), '301',  'Oregostim-1X-Saife-Vet',              0.03,  0.25,   19),
  ((SELECT id FROM f), '302',  'MCP-22%-Phos',                         1.01,  10.11,  20),
  ((SELECT id FROM f), '400',  '40 degree-Sunways',                    0.08,  0.75,   21),
  ((SELECT id FROM f), '0001', 'Kemtrace Supreme-Kemin',               0.08,  0.75,   22),
  ((SELECT id FROM f), '91.5', 'Vitamin-E-50%Rovimix',                 0.02,  0.15,   23),
  ((SELECT id FROM f), '91.9', 'Buti Pearl(Kemin)',                    0.05,  0.50,   24),
  ((SELECT id FROM f), '92.5', 'Hepatocare(Versa)',                    0.05,  0.50,   25),
  ((SELECT id FROM f), '92.9', 'Endox-T Dry',                         0.02,  0.18,   26);
