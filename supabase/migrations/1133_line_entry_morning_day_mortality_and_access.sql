-- Migration 1133: make the line tables match how the farm actually records a
-- day, and open line entry to the four roles that do the entering.
--
-- OWNER'S DECISIONS, recorded here so the shape is traceable:
--   * Eggs: per line, per round -- all four rounds, every line. 64-line sheds
--     mean 256 figures a day; that is what was asked for and the table already
--     enforces UNIQUE (line_id, record_date, round_no).
--   * Mortality: TWO entries per line per day -- MORNING and DAY -- whose sum
--     equals the shed mortality. line_mortality held only one female/male pair,
--     so the split is added here. The existing female/male columns are kept and
--     become the day TOTAL (morning + day), so anything already reading them
--     keeps working and the two can never disagree.
--   * Feed: per line, but ONE feed type chosen for the whole day rather than
--     per line. No schema change needed -- line_feed's
--     UNIQUE (line_id, record_date, feed_type_id) already allows exactly that.
--   * Line totals stay SEPARATE from daily_records. Nothing here writes to
--     daily_records, and no trigger is added that could. The screen compares
--     the two and shows the gap; it never closes it.
--
-- Agraharam Potlapally sheds 1-4 are switched to line_managed. NOTE for the
-- record: shed 4 still holds Flock 19 with its last daily record on 13/06/2026,
-- while sheds 1-3 are on Flock 22 to 26/08/2026. Switching it on is what was
-- asked for; the stale flock is the owner's to resolve.
--
-- Access: a NEW module key 'line_entry', separate from 'line_master'. Admin,
-- shed supervisor, site manager and site incharge all get FULL -- admin was
-- explicitly asked to enter data like the others, not merely view.

-- run_sql.py prints only the first FIVE statements, so the schema change, the
-- shed switch and the permission rows are each folded into one DO block. That
-- leaves statements 3-5 free for verification that is actually visible in the
-- job log -- the only place a silent failure can be caught.

DO $$
BEGIN
  ALTER TABLE public.line_mortality ADD COLUMN IF NOT EXISTS morning_female INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE public.line_mortality ADD COLUMN IF NOT EXISTS morning_male   INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE public.line_mortality ADD COLUMN IF NOT EXISTS day_female     INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE public.line_mortality ADD COLUMN IF NOT EXISTS day_male       INTEGER NOT NULL DEFAULT 0;

  -- Switch the four Agraharam sheds on, scoped by farm name so no other site
  -- can be caught by it.
  UPDATE public.sheds s
  SET line_managed = TRUE
  FROM public.farms f
  WHERE f.id = s.farm_id AND f.name = 'Agraharam Potlapally';
END
$$;

-- The line_entry permission rows, each in its own exception block. Migration
-- 1128 lost all seven of its rows because one INSERT with seven VALUES is a
-- single statement and one bad value aborted the lot. Here one failure cannot
-- take the other six with it.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('admin','full'), ('shed_supervisor','full'),
      ('site_manager','full'), ('site_incharge','full'),
      ('management','hidden'), ('accounts','hidden'), ('viewer','hidden')
    ) AS v(role_name, lvl)
  LOOP
    BEGIN
      INSERT INTO public.role_permissions (role, module_key, level)
      VALUES (r.role_name, 'line_entry', r.lvl)
      ON CONFLICT (role, module_key) DO UPDATE SET level = EXCLUDED.level;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'line_entry permission failed for %: %', r.role_name, SQLERRM;
    END;
  END LOOP;
END
$$;

-- Row policies on the three entry tables. They still carry the original
-- 'auth_all' catch-all from migration 641, which lets ANY signed-in user write
-- -- including the roles the screen treats as hidden. Replaced the same way
-- shed_lines was in migration 1128, so the database enforces the rule too and
-- a hidden menu item is not the only thing in the way.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['line_production','line_mortality','line_feed']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "line_entry_select" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "line_entry_write" ON public.%I', t);
    -- Read: the four entry roles plus management, who need to see the figures
    -- without being able to touch them.
    EXECUTE format($p$CREATE POLICY "line_entry_select" ON public.%I FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid())
                       AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge','management')))$p$, t);
    -- Write: only the four roles that actually enter a day.
    EXECUTE format($p$CREATE POLICY "line_entry_write" ON public.%I FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid())
                       AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid())
                       AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge')))$p$, t);
  END LOOP;
END
$$;

-- VERIFY 1: the four mortality columns exist; exactly the four Agraharam sheds
-- are line-managed and no other farm was switched on; policies are in place.
SELECT (SELECT string_agg(column_name, ',' ORDER BY column_name)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'line_mortality'
          AND column_name IN ('morning_female','morning_male','day_female','day_male')) AS mortality_split_cols,
       (SELECT count(*)::int FROM public.sheds x JOIN public.farms y ON y.id = x.farm_id
        WHERE x.line_managed AND y.name = 'Agraharam Potlapally') AS agraharam_on,
       (SELECT count(*)::int FROM public.sheds x JOIN public.farms y ON y.id = x.farm_id
        WHERE x.line_managed AND y.name <> 'Agraharam Potlapally') AS other_farms_on,
       (SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public'
          AND tablename IN ('line_production','line_mortality','line_feed')) AS entry_policies,
       (SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public'
          AND tablename IN ('line_production','line_mortality','line_feed')
          AND policyname = 'auth_all') AS catch_all_left;

-- VERIFY 2: the seven line_entry rows landed; line_master did NOT move; the
-- three entry tables are still empty, so nothing was written by accident.
SELECT (SELECT count(*)::int FROM public.role_permissions WHERE module_key = 'line_entry') AS rows_written,
       (SELECT string_agg(role || '=' || level, ' | ' ORDER BY role)
        FROM public.role_permissions WHERE module_key = 'line_entry') AS line_entry_access,
       (SELECT string_agg(role || '=' || level, ' | ' ORDER BY role)
        FROM public.role_permissions WHERE module_key = 'line_master') AS line_master_unchanged,
       (SELECT count(*)::int FROM public.line_production) AS line_prod_rows,
       (SELECT count(*)::int FROM public.line_mortality) AS line_mort_rows,
       (SELECT count(*)::int FROM public.line_feed) AS line_feed_rows;
