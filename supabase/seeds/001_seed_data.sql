-- ============================================================
-- NARAENDRA FARMS — SEED DATA v3.0
-- Source: All uploaded Excel files
-- Run AFTER 001_schema.sql
-- ============================================================

-- ============================================================
-- FARMS & SITES
-- ============================================================
INSERT INTO public.farms (code, name, site_type, address, taluka, district, elec_usc_1, elec_usc_2) VALUES
  ('KPALLY',   'Kethireddypally',            'rearing',  'Kethireddypally Village',       'Miryalaguda', 'Nalgonda', '103770721', NULL),
  ('PPALLY',   'Agraharam Potlapally',        'laying',   'Agraharam, Potlapally',          'Miryalaguda', 'Nalgonda', '108508370', NULL),
  ('BPET1',    'Bodjanampet - 1',             'laying',   'Bodjanampet Village',            'Miryalaguda', 'Nalgonda', '103770716', NULL),
  ('BPET2',    'Bodjanampet - 2 (VHL)',       'laying',   'Bodjanampet Village',            'Miryalaguda', 'Nalgonda', '103770715', NULL),
  ('FEEDMILL', 'Feed Mill',                   'feedmill', 'Feed Mill - Naraendra Farms',    'Miryalaguda', 'Nalgonda', '112870608', NULL),
  ('HO',       'Head Office',                 'office',   'Head Office - Naraendra Farms',  'Hyderabad',   'Hyderabad', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ELECTRICITY METERS
-- From: Electricity_Bill_Details_FY2025-26.xlsx R1
-- ============================================================
INSERT INTO public.electricity_meters (farm_id, usc_no, service_no, meter_name) VALUES
  ((SELECT id FROM public.farms WHERE code='BPET1'),    '103770716', '381800159', 'Bodjanampet-1 Main'),
  ((SELECT id FROM public.farms WHERE code='BPET2'),    '103770715', '381800148', 'Bodjanampet-2 Main'),
  ((SELECT id FROM public.farms WHERE code='FEEDMILL'), '112870608', '382100337', 'Feed Mill Main'),
  ((SELECT id FROM public.farms WHERE code='KPALLY'),   '103770721', NULL,        'Kethireddypally Main'),
  ((SELECT id FROM public.farms WHERE code='PPALLY'),   '108508370', NULL,        'Potlapally Main')
ON CONFLICT (usc_no) DO NOTHING;

-- ============================================================
-- SHEDS
-- Source: Naraendra_Farms_Shed_Capacity_Site_Wise.xlsx
-- ============================================================

-- KETHIREDDYPALLY (Rearing — Grower + Brooding sheds)
INSERT INTO public.sheds (farm_id, shed_no, shed_name, shed_type, sex,
  a_side_boxes, b_side_boxes, total_boxes, birds_per_box, water_tank_litres, capacity_female, capacity_male)
SELECT
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  v.shed_no, v.shed_name, v.shed_type, 'combined',
  v.a_side, v.b_side, v.total_boxes, v.bpb, v.water, v.cap_f, v.cap_m
FROM (VALUES
  ('1',  'Kpally Shed 1',  'grower',   NULL, NULL, NULL, NULL, 500,  NULL,  NULL),
  ('2',  'Kpally Shed 2',  'grower',   NULL, NULL, NULL, NULL, 500,  NULL,  NULL),
  ('3',  'Kpally Shed 3',  'grower',   NULL, NULL, NULL, NULL, 500,  NULL,  NULL),
  ('4',  'Kpally Shed 4',  'grower',   NULL, NULL, NULL, NULL, 500,  NULL,  NULL),
  ('5',  'Kpally Shed 5',  'brooding', 528,  564,  1092, 6.0,  500,  6552,  NULL),
  ('6',  'Kpally Shed 6',  'brooding', 770,  518,  1288, 6.0,  500,  7728,  NULL),
  ('7',  'Kpally Shed 7',  'grower',   1344, 1344, 2688, 2.0,  500,  5376,  NULL),
  ('8',  'Kpally Shed 8',  'grower',   1344, 1344, 2688, 2.0,  500,  5376,  NULL),
  ('9',  'Kpally Shed 9',  'grower',   1328, 1344, 2672, 2.0,  500,  5344,  NULL),
  ('10', 'Kpally Shed 10', 'brooding', 864,  928,  1792, 6.0,  1000, 10752, NULL),
  ('11', 'Kpally Shed 11', 'brooding', 480,  840,  1320, 6.0,  500,  7920,  NULL),
  ('12', 'Kpally Shed 12', 'brooding', 480,  840,  1320, 6.0,  500,  7920,  NULL)
) AS v(shed_no, shed_name, shed_type, a_side, b_side, total_boxes, bpb, water, cap_f, cap_m)
ON CONFLICT (farm_id, shed_no) DO NOTHING;

-- AGRAHARAM POTLAPALLY (Laying)
INSERT INTO public.sheds (farm_id, shed_no, shed_name, shed_type, sex,
  capacity_female, capacity_male, total_boxes, birds_per_box, water_tank_litres)
SELECT
  (SELECT id FROM public.farms WHERE code='PPALLY'),
  v.shed_no, v.shed_name, 'laying', 'combined', v.cap_f, v.cap_m, v.boxes, 2.0, 2000
FROM (VALUES
  ('1', 'PPally Shed 1', 11066, 1256, 5533),
  ('2', 'PPally Shed 2', 10868, 1234, 5434),
  ('3', 'PPally Shed 3', 11280, 1280, 5640),
  ('4', 'PPally Shed 4', 11280, 1280, 5640)
) AS v(shed_no, shed_name, cap_f, cap_m, boxes)
ON CONFLICT (farm_id, shed_no) DO NOTHING;

-- BODJANAMPET-1 (Laying)
INSERT INTO public.sheds (farm_id, shed_no, shed_name, shed_type, sex,
  capacity_female, capacity_male, total_boxes, birds_per_box, water_tank_litres)
SELECT
  (SELECT id FROM public.farms WHERE code='BPET1'),
  v.shed_no, v.shed_name, 'laying', 'combined', v.cap_f, v.cap_m, v.boxes, 2.0, 2000
FROM (VALUES
  ('1', 'BPET1 Shed 1', 9480, 1075, 4740),
  ('2', 'BPET1 Shed 2', 9480, 1075, 4740),
  ('3', 'BPET1 Shed 3', 9480, 1075, 4740),
  ('4', 'BPET1 Shed 4', 9480, 1075, 4740)
) AS v(shed_no, shed_name, cap_f, cap_m, boxes)
ON CONFLICT (farm_id, shed_no) DO NOTHING;

-- BODJANAMPET-2 (VHL Laying)
INSERT INTO public.sheds (farm_id, shed_no, shed_name, shed_type, sex, capacity_female, capacity_male)
SELECT
  (SELECT id FROM public.farms WHERE code='BPET2'),
  v.shed_no, v.shed_name, 'laying', 'combined', v.cap_f, v.cap_m
FROM (VALUES
  ('1','BPET2 Shed 1', 10000, 1200),
  ('2','BPET2 Shed 2', 10000, 1200),
  ('3','BPET2 Shed 3', 10000, 1200)
) AS v(shed_no, shed_name, cap_f, cap_m)
ON CONFLICT (farm_id, shed_no) DO NOTHING;

-- ============================================================
-- HATCHERIES (from HE Dispatch data)
-- ============================================================
INSERT INTO public.hatcheries (name, type, location, city) VALUES
  ('Hitech Hatcheries - Hyderabad',       'Hitech', 'Hyderabad',    'Hyderabad'),
  ('Hitech Hatcheries - Nalgonda',        'Hitech', 'Nalgonda',     'Nalgonda'),
  ('Hitech Hatcheries - Miryalaguda',     'Hitech', 'Miryalaguda',  'Miryalaguda'),
  ('Hitech Hatcheries - Suryapet',        'Hitech', 'Suryapet',     'Suryapet'),
  ('Hitech Hatcheries - Khammam',         'Hitech', 'Khammam',      'Khammam'),
  ('VHL Hatchery - Insapur',              'VHL',    'Insapur',      'Nalgonda')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PARTIES (from GRN, HE Sales, NHE Sales data)
-- ============================================================
INSERT INTO public.parties (name, type, category) VALUES
  -- Feed suppliers
  ('Sai Santhosini Traders',         'supplier', 'Maize Supplier'),
  ('Aadithya Pulp N Packs',          'supplier', 'Packaging Supplier'),
  ('RUDRA MINERALLS',                'supplier', 'Mineral Supplier'),
  ('SHRINIVASA AGRO FOODS',          'supplier', 'Soya DOC Supplier'),
  ('VARSHA MULTITECH',               'supplier', 'Premix Supplier'),
  ('Lachhu Nayak',                   'supplier', 'Maize Supplier'),
  -- HE Buyers
  ('Hitech Hatcheries',              'buyer',    'HE Buyer'),
  ('VHL / Venkateshwara Hatcheries', 'buyer',    'HE Buyer'),
  -- NHE Egg Buyers
  ('Meghana Agencies',               'buyer',    'NHE Egg Buyer'),
  -- Bird Buyers
  ('Mondal Traders',                 'buyer',    'Bird Buyer'),
  -- Medicine
  ('Kemin Industries',               'supplier', 'Feed Additive Supplier'),
  -- Gas
  ('HP Gas Agency',                  'supplier', 'Gas Cylinder Supplier')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FEED INGREDIENTS (from Feed_Formula_New_Dr.xlsx + GRN)
-- ============================================================
INSERT INTO public.feed_ingredients (code, name, short_name, category, unit, protein_pct, moisture_pct) VALUES
  ('MAIZE',     'MAIZE-12%Moisture',              'Maize',         'grain',      'kg', 8.5,  12.0),
  ('DORB',      'DORB-17% Protein',               'D O R B',       'grain',      'kg', 17.0, 10.0),
  ('SOYA',      'SOYA DOC-(46%Protein)',           'Soya Doc',      'protein',    'kg', 46.0, 10.0),
  ('LIMST',     'L SP-36.50%-Calcium',             'Lime Stone',    'mineral',    'kg', NULL, NULL),
  ('MCP',       'MCP-22%-Phosphorus',              'M C P',         'mineral',    'kg', NULL, NULL),
  ('SALT',      'SALT-(Ankur/Tata)',               'Salt',          'mineral',    'kg', NULL, NULL),
  ('SODA',      'SODA BICARB-Tata Chemical',       'Alkakarb',      'supplement', 'kg', NULL, NULL),
  ('TOXIFIN',   'Toxifin-360Dry (Kemin)',           'Toxifin',       'additive',   'kg', NULL, NULL),
  ('PREMIX',    'Breeder Premix (Venkys)',          'Premix',        'supplement', 'kg', NULL, NULL),
  ('HEPATO',    'Hepato Care Premix',              'Hepato Care',   'supplement', 'kg', NULL, NULL),
  ('SHELLGRIT', 'Shell Grit',                      'Shell Grit',    'mineral',    'kg', NULL, NULL),
  ('SUNFL',     'Sunflower DOC',                   'Sunflower',     'protein',    'kg', 28.0, NULL),
  ('RAPESEED',  'Rapeseed / Canola',               'Rapeseed',      'protein',    'kg', 34.0, NULL),
  ('LYSINE',    'L-Lysine HCl-78.8%',              'Lysine',        'supplement', 'kg', NULL, NULL),
  ('METHIO',    'DL-Methionine-99%',               'Methionine',    'supplement', 'kg', NULL, NULL),
  ('THREO',     'L-Threonine-98.5%',               'Threonine',     'supplement', 'kg', NULL, NULL),
  ('PAPER_TRAY','23 LB Paper Trays',               'Paper Trays',   'other',      'pcs',NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- FEED TYPES
-- ============================================================
INSERT INTO public.feed_types (code, name, category, week_from, week_to, sex, sort_order) VALUES
  ('BCM',   'Breeder Chick Mash',      'starter',     0,  6,   'female', 1),
  ('BGM',   'Breeder Grower Mash',     'grower',      7,  15,  'female', 2),
  ('BDM',   'Breeder Developer Mash',  'developer',   16, 21,  'female', 3),
  ('PBM',   'Pre Breeder Mash',        'pre_breeder', 22, 25,  'female', 4),
  ('L1',    'Layer-1 / BL1',           'layer',       26, 35,  'female', 5),
  ('L2',    'Layer-2 / BL2',           'layer',       36, 50,  'female', 6),
  ('L3',    'Layer-3 / BL3',           'layer',       51, 99,  'female', 7),
  ('MALE',  'Male Feed',               'male',        0,  99,  'male',   8),
  ('CHICK', 'Chick Feed (Day 1)',       'starter',     0,  0,   'female', 0)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- FEED FORMULAS (from Feed_Formula_New_Dr.xlsx Sheet1 — old vet)
-- Per 1000 kg batch
-- ============================================================
DO $$
DECLARE
  bcm_id UUID; bgm_id UUID; bdm_id UUID; pbm_id UUID; l1_id UUID;
  maize_id UUID; dorb_id UUID; soya_id UUID; limst_id UUID; mcp_id UUID;
  salt_id UUID; soda_id UUID;
BEGIN
  SELECT id INTO bcm_id FROM public.feed_types WHERE code='BCM';
  SELECT id INTO bgm_id FROM public.feed_types WHERE code='BGM';
  SELECT id INTO bdm_id FROM public.feed_types WHERE code='BDM';
  SELECT id INTO pbm_id FROM public.feed_types WHERE code='PBM';
  SELECT id INTO l1_id  FROM public.feed_types WHERE code='L1';

  SELECT id INTO maize_id FROM public.feed_ingredients WHERE code='MAIZE';
  SELECT id INTO dorb_id  FROM public.feed_ingredients WHERE code='DORB';
  SELECT id INTO soya_id  FROM public.feed_ingredients WHERE code='SOYA';
  SELECT id INTO limst_id FROM public.feed_ingredients WHERE code='LIMST';
  SELECT id INTO mcp_id   FROM public.feed_ingredients WHERE code='MCP';
  SELECT id INTO salt_id  FROM public.feed_ingredients WHERE code='SALT';
  SELECT id INTO soda_id  FROM public.feed_ingredients WHERE code='SODA';

  -- BCM (Starter 0-6 wk): Maize 673, Dorb 9, Soya 281, LSP 12, MCP 11, Salt 2.30
  INSERT INTO public.feed_formulas (feed_type_id, ingredient_id, qty_per_ton, effective_from, vet_name) VALUES
    (bcm_id, maize_id, 673,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bcm_id, dorb_id,  9,    '2023-01-01', 'Old Vet - Hitech Formula'),
    (bcm_id, soya_id,  281,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bcm_id, limst_id, 12,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (bcm_id, mcp_id,   11,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (bcm_id, salt_id,  2.30, '2023-01-01', 'Old Vet - Hitech Formula'),
  -- BGM (Grower 7-15wk): Maize 698, Dorb 162, Soya 104, LSP 14, MCP 9, Salt 2.20
    (bgm_id, maize_id, 698,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bgm_id, dorb_id,  162,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bgm_id, soya_id,  104,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bgm_id, limst_id, 14,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (bgm_id, mcp_id,   9,    '2023-01-01', 'Old Vet - Hitech Formula'),
    (bgm_id, salt_id,  2.20, '2023-01-01', 'Old Vet - Hitech Formula'),
  -- BDM (Developer 16-21wk): Maize 724, Dorb 80, Soya 141, LSP 31, MCP 10, Salt 2.14
    (bdm_id, maize_id, 724,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bdm_id, dorb_id,  80,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (bdm_id, soya_id,  141,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (bdm_id, limst_id, 31,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (bdm_id, mcp_id,   10,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (bdm_id, salt_id,  2.14, '2023-01-01', 'Old Vet - Hitech Formula'),
  -- L1 (Layer-1 5%-35th wk): Maize 711, Soya 183, LSP 40, MCP 10, Salt 2.17
    (l1_id,  maize_id, 711,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (l1_id,  soya_id,  183,  '2023-01-01', 'Old Vet - Hitech Formula'),
    (l1_id,  limst_id, 40,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (l1_id,  mcp_id,   10,   '2023-01-01', 'Old Vet - Hitech Formula'),
    (l1_id,  salt_id,  2.17, '2023-01-01', 'Old Vet - Hitech Formula')
  ON CONFLICT (feed_type_id, ingredient_id, effective_from) DO NOTHING;
END $$;

-- ============================================================
-- FLOCKS (16, 17, 19, 20 — from source files)
-- ============================================================
INSERT INTO public.flocks (flock_no, breed, rearing_farm_id, laying_farm_id,
  placement_date, paid_female, paid_male, free_female, free_male, chick_rate,
  laying_start_date, status, close_date) VALUES
(
  '16', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='PPALLY'),
  '2023-11-24', 44000, 5280, 1760, 211, 320,
  '2024-04-01', 'closed', '2025-04-23'
),(
  '17', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='BPET1'),
  '2024-03-30', 35499, 4260, 1421, 170, 320,
  '2024-07-01', 'closed', '2025-08-01'
),(
  '19', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='PPALLY'),
  '2025-02-16', 44000, 5280, 1700, 210, 320,
  '2025-12-28', 'laying', NULL
),(
  '20', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='BPET1'),
  '2025-05-30', 35499, 4260, 1421, 170, 320,
  '2025-11-01', 'laying', NULL
)
ON CONFLICT (flock_no) DO NOTHING;

-- ============================================================
-- ELECTRICITY BILLS
-- Source: Electricity_Bill_Details_FY2025-26.xlsx — March 2025
-- (Full historical data will be imported via app import feature)
-- ============================================================
INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount) VALUES
  (
    (SELECT id FROM public.electricity_meters WHERE usc_no='103770716'),
    '2025-03-01', 21873, 213677
  ),(
    (SELECT id FROM public.electricity_meters WHERE usc_no='103770715'),
    '2025-03-01', 39366, 384003
  ),(
    (SELECT id FROM public.electricity_meters WHERE usc_no='112870608'),
    '2025-03-01', 3675, 37143
  ),(
    (SELECT id FROM public.electricity_meters WHERE usc_no='103770721'),
    '2025-03-01', NULL, 56198
  ),(
    (SELECT id FROM public.electricity_meters WHERE usc_no='108508370'),
    '2025-03-01', NULL, 138964
  )
ON CONFLICT (meter_id, bill_month) DO NOTHING;

-- ============================================================
-- MEDICINES MASTER (from medicine sheets)
-- ============================================================
INSERT INTO public.medicines_master (name, type, unit) VALUES
  ('Solucal',              'supplement', 'kg'),
  ('Toxifin 360 Dry',      'supplement', 'kg'),
  ('Hepato Care Premix',   'supplement', 'kg'),
  ('B-Complex Liquid',     'medicine',   'litre'),
  ('Vitamin AD3E',         'medicine',   'litre'),
  ('Marek''s Vaccine',     'vaccine',    'dose'),
  ('Newcastle Disease Vaccine', 'vaccine', 'dose'),
  ('IBD Vaccine',          'vaccine',    'dose'),
  ('Fowl Pox Vaccine',     'vaccine',    'dose'),
  ('Amoxicillin',          'medicine',   'gm'),
  ('Oxytetracycline',      'medicine',   'gm'),
  ('Colistin',             'medicine',   'gm'),
  ('Doxycycline',          'medicine',   'gm'),
  ('Electrolytes',         'supplement', 'gm'),
  ('Glucovit',             'supplement', 'gm'),
  ('Copper Sulphate',      'medicine',   'gm'),
  ('Phenol',               'disinfectant','litre'),
  ('Formalin',             'disinfectant','litre'),
  ('Finquat',              'disinfectant','litre'),
  ('Virkon-S',             'disinfectant','gm')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SALARY ABSTRACT (sample from April 2024 — abstract sheet)
-- Full historical data imported via Excel import feature
-- ============================================================
INSERT INTO public.salary_abstract (farm_id, month, total_salary, total_advance, net_salary, employee_count) VALUES
  ((SELECT id FROM public.farms WHERE code='BPET1'),  '2024-04-01', 503533, 7989,  495544, 53),
  ((SELECT id FROM public.farms WHERE code='BPET2'),  '2024-04-01', 276232, 3860,  272372, 28),
  ((SELECT id FROM public.farms WHERE code='PPALLY'), '2024-04-01', 684904, 12710, 672194, 72),
  ((SELECT id FROM public.farms WHERE code='KPALLY'), '2024-04-01', 301434, 5200,  296234, 31)
ON CONFLICT (farm_id, month) DO NOTHING;
