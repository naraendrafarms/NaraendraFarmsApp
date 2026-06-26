-- Migration 147: Add label column to config_options + seed all missing category groups
-- After this, every hardcoded dropdown in the app reads from this table.

ALTER TABLE public.config_options ADD COLUMN IF NOT EXISTS label TEXT;

-- GRN receiving categories (used in Bills/GRN entry form)
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('grn_category','Feed',           'Feed / Raw Material',        1),
  ('grn_category','Chicks',         'Chicks (Day-Old Birds)',      2),
  ('grn_category','Medicine',       'Medicine / Oral',            3),
  ('grn_category','Vaccine',        'Vaccine',                    4),
  ('grn_category','Packaging',      'Packaging Material',         5),
  ('grn_category','Other',          'Other',                      6)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Medicine / vaccine types (used in Medicines Master)
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('medicine_type','medicine',      'Medicine',                   1),
  ('medicine_type','vaccine',       'Vaccine',                    2),
  ('medicine_type','supplement',    'Supplement',                 3),
  ('medicine_type','sanitizer',     'Sanitizer',                  4),
  ('medicine_type','injectable',    'Injectable',                 5),
  ('medicine_type','disinfectant',  'Disinfectant',               6),
  ('medicine_type','pesticide',     'Pesticide',                  7),
  ('medicine_type','other',         'Other',                      8)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Feed ingredient categories (used in Feed Ingredients master)
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('ingredient_category','grain',       'Grain',          1),
  ('ingredient_category','protein',     'Protein',        2),
  ('ingredient_category','mineral',     'Mineral',        3),
  ('ingredient_category','supplement',  'Supplement',     4),
  ('ingredient_category','additive',    'Additive',       5),
  ('ingredient_category','other',       'Other',          6)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- PO / Purchase Order material types
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('material_type','Feed Raw Material',  'Feed Raw Material',   1),
  ('material_type','Medicine',           'Medicine',            2),
  ('material_type','Oral Medicine',      'Oral Medicine',       3),
  ('material_type','Feed Medicine',      'Feed Medicine',       4),
  ('material_type','Vaccine',            'Vaccine',             5),
  ('material_type','Larvender',          'Larvender',           6),
  ('material_type','Feedmill Transport', 'Feedmill Transport',  7),
  ('material_type','Packaging',          'Packaging',           8),
  ('material_type','Chemical',           'Chemical',            9),
  ('material_type','Spares',             'Spares',             10),
  ('material_type','Other',              'Other',              11)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Feed mill operating expense categories
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('feedmill_expense','Labour',           'Labour',             1),
  ('feedmill_expense','Oral Medicine',    'Oral Medicine',      2),
  ('feedmill_expense','Electricity',      'Electricity',        3),
  ('feedmill_expense','Fuel',             'Fuel',               4),
  ('feedmill_expense','Maintenance',      'Maintenance',        5),
  ('feedmill_expense','Packaging',        'Packaging',          6),
  ('feedmill_expense','Transport',        'Transport',          7),
  ('feedmill_expense','Other',            'Other',              8)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Farm operating expense categories
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('farm_expense','maintenance',  'Maintenance & Repairs',    1),
  ('farm_expense','transport',    'Transport / Logistics',    2),
  ('farm_expense','water',        'Water',                    3),
  ('farm_expense','fuel',         'Fuel / Generator',         4),
  ('farm_expense','insurance',    'Insurance & Licenses',     5),
  ('farm_expense','admin',        'Administrative',           6),
  ('farm_expense','veterinary',   'Veterinary (non-medicine)',7),
  ('farm_expense','equipment',    'Equipment / Tools',        8),
  ('farm_expense','other',        'Other',                    9)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Payment methods
INSERT INTO public.config_options (grp, value, label, sort_order) VALUES
  ('payment_method','Online',  'Online',       1),
  ('payment_method','NEFT',    'NEFT',         2),
  ('payment_method','RTGS',    'RTGS',         3),
  ('payment_method','IMPS',    'IMPS',         4),
  ('payment_method','Cheque',  'Cheque',       5),
  ('payment_method','Cash',    'Cash',         6)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Verify all groups
SELECT grp, count(*) FROM public.config_options GROUP BY grp ORDER BY grp;
