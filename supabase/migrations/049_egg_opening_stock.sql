-- Migration 049: Egg Opening Stock — one-time opening balance per flock
-- Entered once when data entry begins (from Week 19 Day 1 onwards)
CREATE TABLE IF NOT EXISTS public.egg_opening_stock (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id     UUID NOT NULL REFERENCES public.flocks(id),
  as_of_date   DATE NOT NULL,
  he_grade_a   INTEGER DEFAULT 0,
  he_grade_b   INTEGER DEFAULT 0,
  he_grade_c   INTEGER DEFAULT 0,
  je_eggs      INTEGER DEFAULT 0,
  te_eggs      INTEGER DEFAULT 0,
  be_eggs      INTEGER DEFAULT 0,
  le_eggs      INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id)
);

NOTIFY pgrst, 'reload schema';
