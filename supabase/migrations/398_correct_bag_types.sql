-- Migration 398: replace the guessed bag_type list (395) with the real
-- taxonomy, grounded in actual GRN history + user confirmation of true
-- standard bag sizes (computed averages include normal fill variance,
-- not the printed bag size):
--   Maize 50kg, Soya 50kg, Lime Powder 50kg, Lime Stone Powder 25kg,
--   Lime Stone Grits 25kg, Medicine Bags 25kg, Medicine Bags 50kg,
--   VHL 70kg (site-standard, per user)

DELETE FROM public.config_options WHERE grp = 'bag_type';

INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('bag_type', 'Maize 50kg', 1),
  ('bag_type', 'Soya 50kg', 2),
  ('bag_type', 'Lime Powder 50kg', 3),
  ('bag_type', 'Lime Stone Powder 25kg', 4),
  ('bag_type', 'Lime Stone Grits 25kg', 5),
  ('bag_type', 'Medicine Bags 25kg', 6),
  ('bag_type', 'Medicine Bags 50kg', 7),
  ('bag_type', 'VHL 70kg', 8)
ON CONFLICT (grp, value) DO NOTHING;

SELECT value, sort_order FROM public.config_options WHERE grp = 'bag_type' ORDER BY sort_order;
