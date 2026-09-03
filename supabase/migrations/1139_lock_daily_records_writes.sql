-- Migration 1139: daily_records accepts writes only from the roles that are
-- meant to enter a day.
--
-- Until now daily_records carried the blanket policies created in migration 001
-- for every table in the schema: auth_insert / auth_update / auth_delete, each
-- allowing ANY signed-in user. So a shed supervisor -- or a viewer -- was kept
-- out by the menu and the module permission alone, never by the database.
--
-- WRITE is narrowed to the four roles that actually close a day:
--   admin, accounts, site_manager, site_incharge
-- Deliberately NOT shed_supervisor (their side is the line tables), and not
-- viewer or management (neither enters data anywhere).
--
-- READ IS LEFT WIDE OPEN on purpose. Dashboards, flock summaries, P&L, egg
-- stock and most reports read daily_records, and management and viewer are
-- meant to see all of it. Narrowing SELECT would break working screens for
-- real users, which is exactly what must not happen.
--
-- The chain triggers on daily_records update sibling rows; those updates run as
-- the user doing the write, who is by definition one of the four allowed roles,
-- so the cascade is unaffected. Migrations run as the database owner and bypass
-- RLS entirely.

DO $$
BEGIN
  DROP POLICY IF EXISTS "auth_insert" ON public.daily_records;
  DROP POLICY IF EXISTS "auth_update" ON public.daily_records;
  DROP POLICY IF EXISTS "auth_delete" ON public.daily_records;
  DROP POLICY IF EXISTS "daily_records_write" ON public.daily_records;

  CREATE POLICY "daily_records_write" ON public.daily_records FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.id = (SELECT auth.uid())
                     AND p.is_active
                     AND p.role IN ('admin','accounts','site_manager','site_incharge')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.id = (SELECT auth.uid())
                     AND p.is_active
                     AND p.role IN ('admin','accounts','site_manager','site_incharge')));
END
$$;

-- VERIFY 1: exactly the policies expected. auth_select MUST still be there --
-- if it is missing, every dashboard and report goes blank for everyone.
SELECT string_agg(policyname || ':' || cmd, ' | ' ORDER BY policyname) AS daily_records_policies,
       count(*) FILTER (WHERE policyname = 'auth_select')::int AS read_still_open,
       count(*) FILTER (WHERE policyname IN ('auth_insert','auth_update','auth_delete'))::int AS blanket_write_left
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'daily_records';

-- VERIFY 2: who this actually affects, and that no data moved.
SELECT (SELECT count(*)::int FROM public.profiles
        WHERE is_active AND role IN ('admin','accounts','site_manager','site_incharge')) AS users_who_can_write,
       (SELECT count(*)::int FROM public.profiles
        WHERE is_active AND role NOT IN ('admin','accounts','site_manager','site_incharge')) AS users_now_read_only,
       (SELECT string_agg(role || '=' || c, ', ' ORDER BY role)
        FROM (SELECT role, count(*)::int c FROM public.profiles WHERE is_active GROUP BY role) r) AS active_by_role,
       (SELECT count(*)::int FROM public.daily_records) AS daily_records_rows,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal
          AND tgenabled::text = 'O') AS triggers_still_enabled;
