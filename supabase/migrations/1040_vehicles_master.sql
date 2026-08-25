-- Vehicle master: the shared vehicles (Creta, Innova, Activa...) that appear
-- as a "vendor" on farm_expenses with no farm of their own. Previously that
-- name was just free-typed text and its cash always defaulted to Head
-- Office in code -- this gives each vehicle a real record with its own base
-- farm, editable in one place instead of hardcoded.
CREATE TABLE IF NOT EXISTS public.vehicles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  vehicle_no  TEXT,
  farm_id     UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  remarks     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vehicles_all ON public.vehicles;
CREATE POLICY vehicles_all ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- Seed the 4 vehicles already spending against HO's float in the imported
-- data, based there since that is how their cash has been posted so far.
INSERT INTO public.vehicles (name, farm_id)
SELECT v.name, f.id
FROM (VALUES ('Creta'), ('Innova'), ('Activa'), ('Dosth-AshokLeyland')) AS v(name)
JOIN public.farms f ON f.code = 'HO'
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE name = v.name);

NOTIFY pgrst, 'reload schema';

SELECT string_agg(name || ' -> ' || (SELECT code FROM public.farms WHERE id = vehicles.farm_id), ', ' ORDER BY name) AS seeded
FROM public.vehicles;
