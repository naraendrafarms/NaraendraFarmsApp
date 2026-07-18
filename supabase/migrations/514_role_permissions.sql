-- Admin-managed page/module access control. Replaces the hardcoded `can.*`
-- object in src/lib/auth.ts with a DB-driven lookup so an admin can change
-- who sees what without a code deploy.
--
-- Design (see session discussion): 3 levels only (hidden/read_only/full) —
-- no per-user overrides (6 roles, small team; a role change is the escape
-- hatch), no 4th generic level (delete/approve stay the existing hardcoded
-- can.delete/can.approvePayment checks for v1). Site-level data scoping
-- (site_incharge seeing only their own farm's rows) is a SEPARATE, existing
-- mechanism (useFarmScope.ts) and is NOT expressed here — this table is
-- page-level visibility only.
--
-- Fail-safe rule (enforced in the frontend lookup, not just here): admin is
-- ALWAYS full on every module, hardcoded, never dependent on this table
-- being reachable — so a bad seed or a fetch error can never lock the owner
-- out of the one page (this admin panel) needed to fix it. Every other role
-- fails CLOSED (hidden) if a module_key has no row yet.

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role         TEXT NOT NULL CHECK (role IN ('admin','management','accounts','site_manager','site_incharge','viewer')),
  module_key   TEXT NOT NULL,
  level        TEXT NOT NULL CHECK (level IN ('hidden','read_only','full')) DEFAULT 'hidden',
  updated_by   UUID REFERENCES auth.users(id),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (role, module_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
-- Every authenticated user needs to READ this (to know what they can see);
-- only writes need locking down, and that's enforced in the admin-only
-- frontend page for now (RLS write-lock to admin role is a phase-2 item
-- alongside the rest of the RLS rollout, per the design discussion).
CREATE POLICY "auth_select" ON public.role_permissions FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_insert" ON public.role_permissions FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_update" ON public.role_permissions FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY "auth_delete" ON public.role_permissions FOR DELETE USING (auth.role()='authenticated');

-- Reuse the existing generic audit trigger (fn_audit_log, migration 375) —
-- permission changes are exactly the class of change that should be
-- attributable (who gave a role access to what, and when).
DROP TRIGGER IF EXISTS trg_audit_role_permissions ON public.role_permissions;
CREATE TRIGGER trg_audit_role_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Seed to REPRODUCE TODAY'S ACTUAL BEHAVIOR exactly — nothing changes for
-- any user until an admin edits the grid afterward. Today, only Purchase,
-- Admin, and Planning are actually gated (can.viewPurchase / can.manageUsers
-- / can.viewPlanning in src/lib/auth.ts); every other module is currently
-- open to any logged-in user, so every role gets 'full' there at seed time.
DO $$
DECLARE
  v_role TEXT;
  v_module TEXT;
  all_modules TEXT[] := ARRAY[
    'dashboard','flock_ops','feed_mill','electricity','purchase','inventory',
    'attendance','payroll','masters','reports_ops','reports_financial',
    'accounts','vhl','planning','admin'
  ];
  all_roles TEXT[] := ARRAY['admin','management','accounts','site_manager','site_incharge','viewer'];
BEGIN
  FOREACH v_role IN ARRAY all_roles LOOP
    FOREACH v_module IN ARRAY all_modules LOOP
      INSERT INTO public.role_permissions (role, module_key, level)
      VALUES (
        v_role, v_module,
        CASE
          WHEN v_role = 'admin' THEN 'full'
          WHEN v_module = 'admin' THEN 'hidden'
          WHEN v_module = 'planning' THEN 'hidden'
          WHEN v_module = 'purchase' THEN
            (CASE WHEN v_role IN ('management','accounts') THEN 'full' ELSE 'hidden' END)
          ELSE 'full'
        END
      )
      ON CONFLICT (role, module_key) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

SELECT count(*) AS seeded_rows FROM public.role_permissions;
