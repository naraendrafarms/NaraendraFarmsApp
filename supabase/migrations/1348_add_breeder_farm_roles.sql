-- Seven roles a breeder farm needs that the app did not have: the vet, the
-- hatchery manager, the feed mill manager, the store keeper, the purchase
-- officer, the HR officer and the auditor.
--
-- ROLES ONLY. No frontend change ships with this, by the owner's instruction:
-- the type, the Admin Centre dropdown and the role-aware dashboard come later.
--
-- NOBODY WORKING TODAY IS AFFECTED, and that is the point:
--   * no existing profile's role is read, changed or moved;
--   * no existing role's permissions are touched - the seed only INSERTs rows
--     for the seven NEW roles, and ON CONFLICT DO NOTHING means a re-run can
--     never overwrite a level an admin has since changed;
--   * no user can hold a new role yet, because the Admin Centre dropdown is
--     built from the frontend Role type, which this migration does not change.
-- The rows simply sit there until the code that uses them ships.
--
-- WHY THE CHECKS ARE FOUND BY DEFINITION and not by name: ALTER TABLE ... DROP
-- CONSTRAINT on a wrong name fails SILENTLY through run_sql.py, because "does
-- not exist" is swallowed as success. Migrations 640 and 1129 hit this.

DO $$
DECLARE c_name TEXT;
BEGIN
  -- profiles.role
  SELECT conname INTO c_name FROM pg_constraint
   WHERE conrelid = 'public.profiles'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%site_incharge%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', c_name);
  END IF;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin','management','accounts','site_manager','site_incharge','viewer','shed_supervisor','doctor','hatchery_manager','feed_mill_manager','store_keeper','purchase_officer','hr_officer','auditor'));

  -- role_permissions.role
  SELECT conname INTO c_name FROM pg_constraint
   WHERE conrelid = 'public.role_permissions'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%site_incharge%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.role_permissions DROP CONSTRAINT %I', c_name);
  END IF;
  ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_check
    CHECK (role IN ('admin','management','accounts','site_manager','site_incharge','viewer','shed_supervisor','doctor','hatchery_manager','feed_mill_manager','store_keeper','purchase_officer','hr_officer','auditor'));
END $$;

-- The matrix. Every module is stated for every new role, including the hidden
-- ones, so the Admin Centre shows a complete grid to edit rather than blanks.
-- ON CONFLICT DO NOTHING: re-running never overwrites an admin's own change.
INSERT INTO public.role_permissions (role, module_key, level)
SELECT v.role, v.module_key, v.level
FROM (VALUES
  ('doctor','dashboard','full'),
  ('doctor','flock_ops','full'),
  ('doctor','feed_mill','hidden'),
  ('doctor','electricity','hidden'),
  ('doctor','purchase','hidden'),
  ('doctor','inventory','read_only'),
  ('doctor','attendance','hidden'),
  ('doctor','payroll','hidden'),
  ('doctor','masters','read_only'),
  ('doctor','reports_ops','full'),
  ('doctor','reports_financial','hidden'),
  ('doctor','accounts','hidden'),
  ('doctor','vhl','hidden'),
  ('doctor','planning','hidden'),
  ('doctor','admin','hidden'),
  ('doctor','line_master','read_only'),
  ('doctor','line_entry','hidden'),
  ('hatchery_manager','dashboard','full'),
  ('hatchery_manager','flock_ops','full'),
  ('hatchery_manager','feed_mill','hidden'),
  ('hatchery_manager','electricity','hidden'),
  ('hatchery_manager','purchase','hidden'),
  ('hatchery_manager','inventory','read_only'),
  ('hatchery_manager','attendance','hidden'),
  ('hatchery_manager','payroll','hidden'),
  ('hatchery_manager','masters','read_only'),
  ('hatchery_manager','reports_ops','full'),
  ('hatchery_manager','reports_financial','hidden'),
  ('hatchery_manager','accounts','hidden'),
  ('hatchery_manager','vhl','hidden'),
  ('hatchery_manager','planning','hidden'),
  ('hatchery_manager','admin','hidden'),
  ('hatchery_manager','line_master','hidden'),
  ('hatchery_manager','line_entry','hidden'),
  ('feed_mill_manager','dashboard','full'),
  ('feed_mill_manager','flock_ops','hidden'),
  ('feed_mill_manager','feed_mill','full'),
  ('feed_mill_manager','electricity','read_only'),
  ('feed_mill_manager','purchase','read_only'),
  ('feed_mill_manager','inventory','full'),
  ('feed_mill_manager','attendance','hidden'),
  ('feed_mill_manager','payroll','hidden'),
  ('feed_mill_manager','masters','read_only'),
  ('feed_mill_manager','reports_ops','full'),
  ('feed_mill_manager','reports_financial','hidden'),
  ('feed_mill_manager','accounts','hidden'),
  ('feed_mill_manager','vhl','hidden'),
  ('feed_mill_manager','planning','hidden'),
  ('feed_mill_manager','admin','hidden'),
  ('feed_mill_manager','line_master','hidden'),
  ('feed_mill_manager','line_entry','hidden'),
  ('store_keeper','dashboard','full'),
  ('store_keeper','flock_ops','hidden'),
  ('store_keeper','feed_mill','read_only'),
  ('store_keeper','electricity','hidden'),
  ('store_keeper','purchase','full'),
  ('store_keeper','inventory','full'),
  ('store_keeper','attendance','hidden'),
  ('store_keeper','payroll','hidden'),
  ('store_keeper','masters','read_only'),
  ('store_keeper','reports_ops','full'),
  ('store_keeper','reports_financial','hidden'),
  ('store_keeper','accounts','hidden'),
  ('store_keeper','vhl','hidden'),
  ('store_keeper','planning','hidden'),
  ('store_keeper','admin','hidden'),
  ('store_keeper','line_master','hidden'),
  ('store_keeper','line_entry','hidden'),
  ('purchase_officer','dashboard','full'),
  ('purchase_officer','flock_ops','hidden'),
  ('purchase_officer','feed_mill','read_only'),
  ('purchase_officer','electricity','read_only'),
  ('purchase_officer','purchase','full'),
  ('purchase_officer','inventory','read_only'),
  ('purchase_officer','attendance','hidden'),
  ('purchase_officer','payroll','hidden'),
  ('purchase_officer','masters','read_only'),
  ('purchase_officer','reports_ops','full'),
  ('purchase_officer','reports_financial','read_only'),
  ('purchase_officer','accounts','hidden'),
  ('purchase_officer','vhl','hidden'),
  ('purchase_officer','planning','hidden'),
  ('purchase_officer','admin','hidden'),
  ('purchase_officer','line_master','hidden'),
  ('purchase_officer','line_entry','hidden'),
  ('hr_officer','dashboard','full'),
  ('hr_officer','flock_ops','hidden'),
  ('hr_officer','feed_mill','hidden'),
  ('hr_officer','electricity','hidden'),
  ('hr_officer','purchase','hidden'),
  ('hr_officer','inventory','hidden'),
  ('hr_officer','attendance','full'),
  ('hr_officer','payroll','full'),
  ('hr_officer','masters','read_only'),
  ('hr_officer','reports_ops','read_only'),
  ('hr_officer','reports_financial','hidden'),
  ('hr_officer','accounts','hidden'),
  ('hr_officer','vhl','hidden'),
  ('hr_officer','planning','hidden'),
  ('hr_officer','admin','hidden'),
  ('hr_officer','line_master','hidden'),
  ('hr_officer','line_entry','hidden'),
  ('auditor','dashboard','full'),
  ('auditor','flock_ops','read_only'),
  ('auditor','feed_mill','read_only'),
  ('auditor','electricity','read_only'),
  ('auditor','purchase','read_only'),
  ('auditor','inventory','read_only'),
  ('auditor','attendance','read_only'),
  ('auditor','payroll','read_only'),
  ('auditor','masters','read_only'),
  ('auditor','reports_ops','read_only'),
  ('auditor','reports_financial','read_only'),
  ('auditor','accounts','read_only'),
  ('auditor','vhl','read_only'),
  ('auditor','planning','read_only'),
  ('auditor','admin','hidden'),
  ('auditor','line_master','read_only'),
  ('auditor','line_entry','hidden')
) AS v(role, module_key, level)
ON CONFLICT (role, module_key) DO NOTHING;

-- Verify: the seven new roles, their row counts, and how many are not hidden.
SELECT string_agg(line, ' | ' ORDER BY role) AS seeded
FROM (
  SELECT role,
         role || '=' || COUNT(*) || 'rows/' || COUNT(*) FILTER (WHERE level <> 'hidden') || 'open' AS line
    FROM public.role_permissions
   WHERE role IN ('doctor','hatchery_manager','feed_mill_manager','store_keeper','purchase_officer','hr_officer','auditor')
   GROUP BY role
) s;

-- And prove the seven EXISTING roles were not touched.
SELECT string_agg(line, ' | ' ORDER BY role) AS untouched
FROM (
  SELECT role, role || '=' || COUNT(*) || 'rows' AS line
    FROM public.role_permissions
   WHERE role IN ('admin','management','accounts','site_manager','site_incharge','viewer','shed_supervisor')
   GROUP BY role
) s;
