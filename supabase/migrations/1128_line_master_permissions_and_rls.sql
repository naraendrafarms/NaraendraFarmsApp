-- Migration 1128: give the Line Master its own access rule, in the database.
--
-- WHY A SEPARATE MODULE KEY
-- Access is granted per module, not per page. Verified live in migration 1127:
-- site_manager and site_incharge both hold 'full' on 'masters', so a Line
-- Master page living plainly under that module would let them EDIT the line
-- data, not just view it. And shed_supervisor has ZERO rows in
-- role_permissions -- it was added to the role list in migration 640 and never
-- granted anything -- so a supervisor would see nothing at all.
--
-- 'line_master' is a fresh key (0 rows today, checked). The page still sits
-- under the Masters tab; it just carries its own rule, so nobody's existing
-- rights anywhere else in Masters change.
--
--   admin                                     -> full       (edit)
--   shed_supervisor, site_manager, site_incharge -> read_only (view)
--   management, accounts, viewer              -> hidden
--
-- ON CONFLICT DO NOTHING so re-running never overwrites a level somebody has
-- since changed in User Management.

INSERT INTO public.role_permissions (role, module_key, level)
VALUES
  ('admin',           'line_master', 'full'),
  ('shed_supervisor', 'line_master', 'read_only'),
  ('site_manager',    'line_master', 'read_only'),
  ('site_incharge',   'line_master', 'read_only'),
  ('management',      'line_master', 'hidden'),
  ('accounts',        'line_master', 'hidden'),
  ('viewer',          'line_master', 'hidden')
ON CONFLICT (role, module_key) DO NOTHING;

-- The screen hiding a button is not protection: a user can call the API
-- directly. These policies are what actually enforce it.
--
-- The old policy was FOR ALL with auth.role() = 'authenticated' -- every
-- logged-in user could read AND write every line. It is replaced.
--
-- auth.uid() is wrapped in a scalar subquery so Postgres evaluates it once per
-- query instead of once per row. That is the "Auth RLS Initialization Plan"
-- advisor warning; writing it correctly here keeps this table off that list.

DROP POLICY IF EXISTS "auth_all" ON public.shed_lines;

DROP POLICY IF EXISTS shed_lines_select ON public.shed_lines;

CREATE POLICY shed_lines_select ON public.shed_lines FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge')
  )
);

DROP POLICY IF EXISTS shed_lines_insert ON public.shed_lines;

CREATE POLICY shed_lines_insert ON public.shed_lines FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p
          WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
);

DROP POLICY IF EXISTS shed_lines_update ON public.shed_lines;

CREATE POLICY shed_lines_update ON public.shed_lines FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p
          WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
);

DROP POLICY IF EXISTS shed_lines_delete ON public.shed_lines;

CREATE POLICY shed_lines_delete ON public.shed_lines FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p
          WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
);

-- VERIFY 1: the seven permission rows.
SELECT string_agg(role || '=' || level, ' | ' ORDER BY role) AS line_master_access
FROM public.role_permissions WHERE module_key = 'line_master';

-- VERIFY 2: the policies now on shed_lines, and the old catch-all is gone.
SELECT string_agg(policyname || ':' || cmd, ' | ' ORDER BY policyname) AS shed_lines_policies
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shed_lines';

-- VERIFY 3: no policy on this table still calls auth.uid() unwrapped.
SELECT count(*)::int AS policies_with_per_row_auth_call
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'shed_lines'
  AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%auth.uid()%'
  AND (COALESCE(qual,'') || COALESCE(with_check,'')) NOT LIKE '%SELECT auth.uid()%';

-- VERIFY 4: the 484 loaded rows are untouched by any of this.
SELECT count(*)::int AS shed_lines_rows FROM public.shed_lines;

-- VERIFY 5: nobody else's Masters access changed.
SELECT string_agg(role || '=' || level, ' | ' ORDER BY role) AS masters_access_unchanged
FROM public.role_permissions WHERE module_key = 'masters';
