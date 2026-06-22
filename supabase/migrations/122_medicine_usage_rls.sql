-- Migration 122: Add missing RLS policies for medicine_usage and fix daily_feed

-- medicine_usage: RLS enabled but no policies exist → everything blocked
CREATE POLICY IF NOT EXISTS "auth_select_medicine_usage"
  ON public.medicine_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "auth_insert_medicine_usage"
  ON public.medicine_usage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_update_medicine_usage"
  ON public.medicine_usage FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "auth_delete_medicine_usage"
  ON public.medicine_usage FOR DELETE TO authenticated USING (true);

-- medicine_monthly: same issue
CREATE POLICY IF NOT EXISTS "auth_select_medicine_monthly"
  ON public.medicine_monthly FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "auth_insert_medicine_monthly"
  ON public.medicine_monthly FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_update_medicine_monthly"
  ON public.medicine_monthly FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "auth_delete_medicine_monthly"
  ON public.medicine_monthly FOR DELETE TO authenticated USING (true);

-- daily_feed: existing policies use auth.role() which can fail; add TO authenticated versions
CREATE POLICY IF NOT EXISTS "auth_select_daily_feed"
  ON public.daily_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "auth_insert_daily_feed"
  ON public.daily_feed FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_update_daily_feed"
  ON public.daily_feed FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "auth_delete_daily_feed"
  ON public.daily_feed FOR DELETE TO authenticated USING (true);

-- Diagnostic: confirm policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('medicine_usage','medicine_monthly','daily_feed')
ORDER BY tablename, cmd;

NOTIFY pgrst, 'reload schema';
