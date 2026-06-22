-- Migration 127: Nuclear RLS reset for daily_feed and medicine_usage
-- Disable RLS, drop ALL policies, re-enable, create clean TO authenticated policies
-- This ensures no conflicting old policies remain

-- ── daily_feed ────────────────────────────────────────────────────────────────
ALTER TABLE public.daily_feed DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='daily_feed'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_feed', pol.policyname);
  END LOOP;
END
$$;

ALTER TABLE public.daily_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "df_select" ON public.daily_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "df_insert" ON public.daily_feed FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "df_update" ON public.daily_feed FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "df_delete" ON public.daily_feed FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.daily_feed TO authenticated;

-- ── medicine_usage ────────────────────────────────────────────────────────────
ALTER TABLE public.medicine_usage DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='medicine_usage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.medicine_usage', pol.policyname);
  END LOOP;
END
$$;

ALTER TABLE public.medicine_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mu_select" ON public.medicine_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY "mu_insert" ON public.medicine_usage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mu_update" ON public.medicine_usage FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mu_delete" ON public.medicine_usage FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.medicine_usage TO authenticated;

-- ── medicine_monthly ──────────────────────────────────────────────────────────
ALTER TABLE public.medicine_monthly DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='medicine_monthly'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.medicine_monthly', pol.policyname);
  END LOOP;
END
$$;

ALTER TABLE public.medicine_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mm_select" ON public.medicine_monthly FOR SELECT TO authenticated USING (true);
CREATE POLICY "mm_insert" ON public.medicine_monthly FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mm_update" ON public.medicine_monthly FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mm_delete" ON public.medicine_monthly FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.medicine_monthly TO authenticated;

-- Diagnostic: confirm clean state
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('daily_feed','medicine_usage','medicine_monthly')
ORDER BY tablename, cmd;

NOTIFY pgrst, 'reload schema';
