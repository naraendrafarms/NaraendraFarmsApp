-- Migration 1127: read-only. Before adding a Line Master page under Masters,
-- find out what access each role really has today.
--
-- Why this matters: module access is granted per MODULE, not per page. If the
-- Line Master simply lives inside the existing 'masters' module, then whatever
-- a role has for Masters as a whole is what it gets for the line data -- which
-- may be full edit rights, not the view-only the owner asked for. And
-- shed_supervisor was added in migration 640 without seeding role_permissions
-- at all, so it may have no access to anything.
--
-- The seed in migration 514 is not proof of current state: permissions are
-- editable from User Management, so they are read live here.

-- 1. Who can reach Masters today, and at what level.
SELECT string_agg(role || '=' || level, ' | ' ORDER BY role) AS masters_access
FROM public.role_permissions WHERE module_key = 'masters';

-- 2. Does shed_supervisor have ANY permission rows at all?
SELECT count(*)::int AS shed_supervisor_rows,
       COALESCE(string_agg(DISTINCT level, ','), '-') AS levels
FROM public.role_permissions WHERE role = 'shed_supervisor';

-- 3. Every distinct role present in the permissions table.
SELECT string_agg(DISTINCT role, ', ' ORDER BY role) AS roles_with_permissions
FROM public.role_permissions;

-- 4. Is 'line_master' already taken as a module key?
SELECT count(*)::int AS line_master_rows
FROM public.role_permissions WHERE module_key = 'line_master';

-- 5. How many real users hold each role, so the change is judged against
--    people who actually exist rather than the role list.
SELECT COALESCE(string_agg(r.role || '=' || r.n::text, ' | ' ORDER BY r.role), 'NO PROFILES') AS users_per_role
FROM (SELECT role, count(*) AS n FROM public.profiles GROUP BY role) r;
