-- Migration 161: Enable RLS + grant permissions on items table

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_select" ON public.items;
DROP POLICY IF EXISTS "items_insert" ON public.items;
DROP POLICY IF EXISTS "items_update" ON public.items;
DROP POLICY IF EXISTS "items_delete" ON public.items;

CREATE POLICY "items_select" ON public.items FOR SELECT USING (true);
CREATE POLICY "items_insert" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_update" ON public.items FOR UPDATE USING (true);
CREATE POLICY "items_delete" ON public.items FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated, anon;

-- Verify
SELECT COUNT(*) AS items_count FROM public.items;
