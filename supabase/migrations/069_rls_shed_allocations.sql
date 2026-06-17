-- Migration 069: Add RLS policies to shed_allocations and supplier_invoices
-- shed_allocations was created in 050 without RLS policies

ALTER TABLE public.shed_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_shed_allocations"
  ON public.shed_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_shed_allocations"
  ON public.shed_allocations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_shed_allocations"
  ON public.shed_allocations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_shed_allocations"
  ON public.shed_allocations FOR DELETE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
