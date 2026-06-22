-- Enable RLS and add policies for nhe_sale_lines
ALTER TABLE public.nhe_sale_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_nhe_sale_lines" ON public.nhe_sale_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_nhe_sale_lines" ON public.nhe_sale_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_nhe_sale_lines" ON public.nhe_sale_lines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_nhe_sale_lines" ON public.nhe_sale_lines FOR DELETE TO authenticated USING (true);

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'nhe_sale_lines';

NOTIFY pgrst, 'reload schema';
