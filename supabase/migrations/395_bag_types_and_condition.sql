-- Migration 395: bag type + condition tracking (Empty Bags module)
--
-- Both grn.bags (received count) and bag_sales.qty (sold count) have been
-- one flat number with no type breakdown — every bag (jute/gunny, maize/
-- woven, feed 25kg/50kg, VHL 70kg, medicine bags) got lumped into one
-- fungible bucket, with a single rate per sale. Per user: track bag type
-- (material + size + VHL + medicine as one combined list) and a separate
-- Good/Damaged condition per sale, each combination priced independently.

-- Configurable dropdown (same pattern as material_type, designation, etc.)
-- so the bag type list can be edited later without a code change.
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('bag_type', 'Gunny 25kg', 1),
  ('bag_type', 'Gunny 50kg', 2),
  ('bag_type', 'Maize 25kg', 3),
  ('bag_type', 'Maize 50kg', 4),
  ('bag_type', 'VHL 70kg', 5),
  ('bag_type', 'Medicine Bags', 6)
ON CONFLICT (grp, value) DO NOTHING;

ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS bag_type TEXT;

ALTER TABLE public.bag_sales ADD COLUMN IF NOT EXISTS bag_type TEXT;
ALTER TABLE public.bag_sales ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'Good' CHECK (condition IN ('Good', 'Damaged'));

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('grn', 'bag_sales') AND column_name IN ('bag_type', 'condition')
ORDER BY table_name, column_name;
