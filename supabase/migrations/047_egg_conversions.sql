-- Migration 047: Egg Conversions — track HE↔NHE type conversions
-- e.g. HE Grade C → Table Eggs, or Table Eggs → HE Grade B
CREATE TABLE IF NOT EXISTS public.egg_conversions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id         UUID REFERENCES public.flocks(id),
  farm_id          UUID REFERENCES public.farms(id),
  conversion_date  DATE NOT NULL,
  from_type        TEXT NOT NULL,
  from_qty         INTEGER NOT NULL,
  to_type          TEXT NOT NULL,
  to_qty           INTEGER NOT NULL,
  reason           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
