-- Migration 098: RLS policies for categories_master and units_master

ALTER TABLE public.categories_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_master_select" ON public.categories_master;
DROP POLICY IF EXISTS "categories_master_insert" ON public.categories_master;
DROP POLICY IF EXISTS "categories_master_update" ON public.categories_master;
DROP POLICY IF EXISTS "categories_master_delete" ON public.categories_master;

CREATE POLICY "categories_master_select" ON public.categories_master FOR SELECT USING (true);
CREATE POLICY "categories_master_insert" ON public.categories_master FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_master_update" ON public.categories_master FOR UPDATE USING (true);
CREATE POLICY "categories_master_delete" ON public.categories_master FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories_master TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.categories_master_id_seq TO authenticated, anon;

DROP POLICY IF EXISTS "units_master_select" ON public.units_master;
DROP POLICY IF EXISTS "units_master_insert" ON public.units_master;
DROP POLICY IF EXISTS "units_master_update" ON public.units_master;
DROP POLICY IF EXISTS "units_master_delete" ON public.units_master;

CREATE POLICY "units_master_select" ON public.units_master FOR SELECT USING (true);
CREATE POLICY "units_master_insert" ON public.units_master FOR INSERT WITH CHECK (true);
CREATE POLICY "units_master_update" ON public.units_master FOR UPDATE USING (true);
CREATE POLICY "units_master_delete" ON public.units_master FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.units_master TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.units_master_id_seq TO authenticated, anon;

-- Diagnostic
SELECT 'categories_master' AS tbl, count(*) FROM public.categories_master
UNION ALL SELECT 'units_master', count(*) FROM public.units_master;
