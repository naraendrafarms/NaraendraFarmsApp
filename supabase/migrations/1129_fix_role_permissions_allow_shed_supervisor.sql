-- Migration 1129: let role_permissions actually hold 'shed_supervisor'.
--
-- Migration 1128's INSERT failed outright:
--   ERROR 23514: new row for relation "role_permissions" violates check
--   constraint "role_permissions_role_check"
--
-- Migration 640 widened profiles.role to include shed_supervisor but left
-- role_permissions.role on its original six-role CHECK from migration 514. So
-- the database would accept a shed supervisor USER while refusing to store any
-- permission for that role -- which is why the role has had no access to
-- anything since the day it was created.
--
-- One INSERT with seven VALUES is a single statement, so the one bad row
-- aborted all seven. None of the line_master permissions were written. The
-- shed_lines policies from 1128 DID apply (they were later statements), so
-- until this runs the page is admin-only in practice: admin short-circuits the
-- permission lookup, everyone else resolves to hidden.

DO $$
DECLARE c_name TEXT;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.role_permissions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role%'
    AND pg_get_constraintdef(oid) ILIKE '%admin%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.role_permissions DROP CONSTRAINT %I', c_name);
  END IF;
END
$$;

ALTER TABLE public.role_permissions
  ADD CONSTRAINT role_permissions_role_check
  CHECK (role IN ('admin','management','accounts','site_manager','site_incharge','viewer','shed_supervisor'));

-- Now the rows 1128 meant to write.
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

-- VERIFY 1: all seven rows are present and at the intended levels.
SELECT count(*)::int AS rows_written,
       string_agg(role || '=' || level, ' | ' ORDER BY role) AS line_master_access
FROM public.role_permissions WHERE module_key = 'line_master';

-- VERIFY 2: the role rule now admits shed_supervisor.
SELECT COALESCE(string_agg(pg_get_constraintdef(oid), ' | '), 'NONE') AS role_check
FROM pg_constraint
WHERE conrelid = 'public.role_permissions'::regclass AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%shed_supervisor%';

-- VERIFY 3: the shed_lines policies from 1128 are in place.
SELECT string_agg(policyname || ':' || cmd, ' | ' ORDER BY policyname) AS shed_lines_policies
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shed_lines';

-- VERIFY 4: nobody else's Masters access moved.
SELECT string_agg(role || '=' || level, ' | ' ORDER BY role) AS masters_unchanged
FROM public.role_permissions WHERE module_key = 'masters';

-- VERIFY 5: the 484 loaded lines are still there.
SELECT count(*)::int AS shed_lines_rows FROM public.shed_lines;
