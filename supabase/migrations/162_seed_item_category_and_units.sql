-- Migration 162: Seed item_category, unit, medicine_subtype into config_options
-- These groups were missing causing empty dropdowns in Items Master edit form

INSERT INTO public.config_options (grp, value, label, sort_order, is_active)
VALUES
  -- Item Categories
  ('item_category', 'Feed Ingredient', 'Feed Ingredient',  1, TRUE),
  ('item_category', 'Medicine',        'Medicine',          2, TRUE),
  ('item_category', 'Vaccine',         'Vaccine',           3, TRUE),
  ('item_category', 'Supplement',      'Supplement',        4, TRUE),
  ('item_category', 'Injectable',      'Injectable',        5, TRUE),
  ('item_category', 'Sanitizer',       'Sanitizer',         6, TRUE),
  ('item_category', 'Disinfectant',    'Disinfectant',      7, TRUE),
  ('item_category', 'Pesticide',       'Pesticide',         8, TRUE),
  ('item_category', 'Packaging',       'Packaging',         9, TRUE),
  ('item_category', 'Equipment',       'Equipment',        10, TRUE),
  ('item_category', 'Spares',          'Spares',           11, TRUE),
  ('item_category', 'Chemical',        'Chemical',         12, TRUE),
  ('item_category', 'Chicks',          'Chicks',           13, TRUE),
  ('item_category', 'Other',           'Other',            14, TRUE),

  -- Units of Measure
  ('unit', 'kg',      'kg',      1, TRUE),
  ('unit', 'MT',      'MT',      2, TRUE),
  ('unit', 'Quintal', 'Quintal', 3, TRUE),
  ('unit', 'Ltr',     'Ltr',     4, TRUE),
  ('unit', 'ML',      'ML',      5, TRUE),
  ('unit', 'Gms',     'Gms',     6, TRUE),
  ('unit', 'Dose',    'Dose',    7, TRUE),
  ('unit', 'Nos',     'Nos',     8, TRUE),
  ('unit', 'Box',     'Box',     9, TRUE),
  ('unit', 'Bag',     'Bag',    10, TRUE),
  ('unit', 'Mtrs',    'Mtrs',   11, TRUE),

  -- Medicine Sub-Types
  ('medicine_subtype', 'tablet',   'Tablet',   1, TRUE),
  ('medicine_subtype', 'liquid',   'Liquid',   2, TRUE),
  ('medicine_subtype', 'powder',   'Powder',   3, TRUE),
  ('medicine_subtype', 'vial',     'Vial',     4, TRUE),
  ('medicine_subtype', 'injection','Injection',5, TRUE),
  ('medicine_subtype', 'spray',    'Spray',    6, TRUE),
  ('medicine_subtype', 'other',    'Other',    7, TRUE)

ON CONFLICT (grp, value) DO NOTHING;

-- Verify
SELECT grp, COUNT(*) AS cnt FROM public.config_options
WHERE grp IN ('item_category','unit','medicine_subtype')
GROUP BY grp ORDER BY grp;
