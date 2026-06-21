-- Fix: he_dispatch_lines was missing RLS policy (causes insert error for authenticated users)
ALTER TABLE public.he_dispatch_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_he_dispatch_lines" ON public.he_dispatch_lines;
CREATE POLICY "auth_all_he_dispatch_lines" ON public.he_dispatch_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add TDS column to he_dispatch (buyer-deducted tax at source on hatching egg payments)
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(12,2) DEFAULT 0;
