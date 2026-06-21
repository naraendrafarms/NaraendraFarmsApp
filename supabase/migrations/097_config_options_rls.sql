-- Migration 097: RLS policies for config_options + seed categories/units if empty

-- Allow all authenticated users to read/write config_options
ALTER TABLE public.config_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_options_select" ON public.config_options;
DROP POLICY IF EXISTS "config_options_insert" ON public.config_options;
DROP POLICY IF EXISTS "config_options_update" ON public.config_options;
DROP POLICY IF EXISTS "config_options_delete" ON public.config_options;

CREATE POLICY "config_options_select" ON public.config_options FOR SELECT USING (true);
CREATE POLICY "config_options_insert" ON public.config_options FOR INSERT WITH CHECK (true);
CREATE POLICY "config_options_update" ON public.config_options FOR UPDATE USING (true);
CREATE POLICY "config_options_delete" ON public.config_options FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_options TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.config_options_id_seq TO authenticated, anon;

-- Seed categories_master if empty
INSERT INTO public.categories_master (name, sort_order)
SELECT v.name, v.ord
FROM (VALUES
  ('Feed',1),('Medicine',2),('Vaccine',3),
  ('Packaging',4),('Chemical',5),('Spares',6),('Other',7)
) AS v(name,ord)
WHERE NOT EXISTS (SELECT 1 FROM public.categories_master LIMIT 1);

-- Seed units_master if empty
INSERT INTO public.units_master (name, sort_order)
SELECT v.name, v.ord
FROM (VALUES
  ('kg',1),('MT',2),('Quintal',3),('Ltr',4),('ML',5),
  ('Gms',6),('Dose',7),('Nos',8),('Box',9),('Mtrs',10),('Bag',11)
) AS v(name,ord)
WHERE NOT EXISTS (SELECT 1 FROM public.units_master LIMIT 1);

-- Diagnostic: confirm row counts
SELECT 'categories_master' AS tbl, count(*) FROM public.categories_master
UNION ALL SELECT 'units_master', count(*) FROM public.units_master
UNION ALL SELECT 'config_options', count(*) FROM public.config_options;
