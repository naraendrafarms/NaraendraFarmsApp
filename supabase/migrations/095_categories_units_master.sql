-- Migration 095: Create categories_master and units_master tables
-- These replace hardcoded arrays in InventoryPages / forms so they can be managed from Admin Centre

CREATE TABLE IF NOT EXISTS public.categories_master (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units_master (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default categories
INSERT INTO public.categories_master (name, sort_order) VALUES
  ('Feed',       1),
  ('Medicine',   2),
  ('Vaccine',    3),
  ('Packaging',  4),
  ('Chemical',   5),
  ('Spares',     6),
  ('Other',      7)
ON CONFLICT (name) DO NOTHING;

-- Seed default units
INSERT INTO public.units_master (name, sort_order) VALUES
  ('kg',      1),
  ('MT',      2),
  ('Quintal', 3),
  ('Ltr',     4),
  ('ML',      5),
  ('Gms',     6),
  ('Dose',    7),
  ('Nos',     8),
  ('Box',     9),
  ('Mtrs',   10),
  ('Bag',    11)
ON CONFLICT (name) DO NOTHING;

NOTIFY pgrst, 'reload schema';

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('categories_master','units_master');
