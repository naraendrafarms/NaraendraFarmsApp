-- Migration 126: Drop old auth.role() policies that break DELETE/UPDATE on daily_feed and medicine_usage
-- Replace with TO authenticated pattern which works correctly in Supabase PostgREST

-- ── daily_feed ────────────────────────────────────────────────────
-- Drop old auth.role() policies (from migration 016)
DROP POLICY IF EXISTS "auth_select" ON public.daily_feed;
DROP POLICY IF EXISTS "auth_insert" ON public.daily_feed;
DROP POLICY IF EXISTS "auth_update" ON public.daily_feed;
DROP POLICY IF EXISTS "auth_delete"  ON public.daily_feed;

-- Ensure new TO authenticated policies exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_feed' AND policyname='auth_select_daily_feed') THEN
    CREATE POLICY "auth_select_daily_feed" ON public.daily_feed FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_feed' AND policyname='auth_insert_daily_feed') THEN
    CREATE POLICY "auth_insert_daily_feed" ON public.daily_feed FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_feed' AND policyname='auth_update_daily_feed') THEN
    CREATE POLICY "auth_update_daily_feed" ON public.daily_feed FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_feed' AND policyname='auth_delete_daily_feed') THEN
    CREATE POLICY "auth_delete_daily_feed" ON public.daily_feed FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

-- ── medicine_usage ────────────────────────────────────────────────
-- Drop any old auth.role() style policies
DROP POLICY IF EXISTS "auth_select" ON public.medicine_usage;
DROP POLICY IF EXISTS "auth_insert" ON public.medicine_usage;
DROP POLICY IF EXISTS "auth_update" ON public.medicine_usage;
DROP POLICY IF EXISTS "auth_delete"  ON public.medicine_usage;
DROP POLICY IF EXISTS "Authenticated users can read medicine_usage" ON public.medicine_usage;
DROP POLICY IF EXISTS "Authenticated users can insert medicine_usage" ON public.medicine_usage;
DROP POLICY IF EXISTS "Authenticated users can update medicine_usage" ON public.medicine_usage;
DROP POLICY IF EXISTS "Authenticated users can delete medicine_usage" ON public.medicine_usage;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_usage' AND policyname='auth_select_medicine_usage') THEN
    CREATE POLICY "auth_select_medicine_usage" ON public.medicine_usage FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_usage' AND policyname='auth_insert_medicine_usage') THEN
    CREATE POLICY "auth_insert_medicine_usage" ON public.medicine_usage FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_usage' AND policyname='auth_update_medicine_usage') THEN
    CREATE POLICY "auth_update_medicine_usage" ON public.medicine_usage FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_usage' AND policyname='auth_delete_medicine_usage') THEN
    CREATE POLICY "auth_delete_medicine_usage" ON public.medicine_usage FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

-- ── medicine_monthly ──────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select" ON public.medicine_monthly;
DROP POLICY IF EXISTS "auth_insert" ON public.medicine_monthly;
DROP POLICY IF EXISTS "auth_update" ON public.medicine_monthly;
DROP POLICY IF EXISTS "auth_delete"  ON public.medicine_monthly;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_monthly' AND policyname='auth_select_medicine_monthly') THEN
    CREATE POLICY "auth_select_medicine_monthly" ON public.medicine_monthly FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_monthly' AND policyname='auth_insert_medicine_monthly') THEN
    CREATE POLICY "auth_insert_medicine_monthly" ON public.medicine_monthly FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_monthly' AND policyname='auth_update_medicine_monthly') THEN
    CREATE POLICY "auth_update_medicine_monthly" ON public.medicine_monthly FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='medicine_monthly' AND policyname='auth_delete_medicine_monthly') THEN
    CREATE POLICY "auth_delete_medicine_monthly" ON public.medicine_monthly FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

-- Also fix medicine_usage delete mutation — add error throw in frontend is a code fix
-- but also ensure the unique constraint won't block bulk operations

-- Diagnostic: confirm only clean policies remain
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('medicine_usage','medicine_monthly','daily_feed')
ORDER BY tablename, cmd;

NOTIFY pgrst, 'reload schema';
