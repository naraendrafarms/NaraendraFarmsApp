-- Line-level entry, step 2 of 5: the shed supervisor role and shed assignment.
--
-- profiles.role is constrained by a CHECK listing the six existing roles
-- (001_schema.sql line 496: admin, management, accounts, site_manager,
-- site_incharge, viewer). A seventh value cannot simply be inserted -- the
-- CHECK has to be widened first. The constraint is found by its definition
-- rather than by an assumed name, because ALTER TABLE ... DROP CONSTRAINT on a
-- wrong name fails silently through run_sql.py ("does not exist" is swallowed
-- as success).
--
-- profile_sheds: a supervisor holds specific sheds. profiles.farm_id alone is
-- too coarse -- a site has up to twelve sheds and a supervisor does not run
-- all of them.
--
-- No existing profile is touched. No existing role is removed.

DO $$
DECLARE cname TEXT;
BEGIN
  SELECT conname INTO cname FROM pg_constraint
   WHERE conrelid = 'public.profiles'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%site_incharge%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin','management','accounts','site_manager','site_incharge','viewer','shed_supervisor'));
END $$;

CREATE TABLE IF NOT EXISTS public.profile_sheds (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shed_id    UUID NOT NULL REFERENCES public.sheds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (profile_id, shed_id)
);

ALTER TABLE public.profile_sheds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.profile_sheds FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- VERIFY (statement 5): the CHECK now lists shed_supervisor, profile_sheds
-- exists and is empty, and every existing profile still holds the role it held
-- before -- counted by role so a silent wipe would be visible.
SELECT (SELECT pg_get_constraintdef(oid) FROM pg_constraint
         WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_role_check') AS role_check_now,
       (SELECT COUNT(*) FROM public.profile_sheds) AS profile_sheds_rows_should_be_zero,
       (SELECT string_agg(role || '=' || c, ', ' ORDER BY role)
          FROM (SELECT COALESCE(role,'(null)') AS role, COUNT(*) AS c
                  FROM public.profiles GROUP BY 1) r) AS profiles_by_role;
