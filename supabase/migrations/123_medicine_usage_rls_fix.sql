-- Migration 123: Add RLS policies for medicine_usage, medicine_monthly, daily_feed
-- Uses DO blocks because CREATE POLICY IF NOT EXISTS is not valid PostgreSQL syntax

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

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('medicine_usage','medicine_monthly','daily_feed')
ORDER BY tablename, cmd;

NOTIFY pgrst, 'reload schema';
