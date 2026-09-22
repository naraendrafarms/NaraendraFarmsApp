-- READ ONLY. No INSERT, UPDATE, DELETE or DDL. Nothing is written.
-- Exactly what each EXISTING role will see on the dashboard, from the modules
-- the panels actually check. Admin is not listed: it is hardcoded full in the
-- frontend and never reads this table, so it always sees everything.
SELECT string_agg(line, '  ||  ' ORDER BY role) AS dashboard_by_role
FROM (
  SELECT role,
         role
           || ' flock=' || MAX(level) FILTER (WHERE module_key = 'flock_ops')
           || ' money=' || MAX(level) FILTER (WHERE module_key = 'reports_financial')
           || ' elec='  || MAX(level) FILTER (WHERE module_key = 'electricity')
           || ' feed='  || MAX(level) FILTER (WHERE module_key = 'feed_mill')
           || ' inv='   || MAX(level) FILTER (WHERE module_key = 'inventory')
           || ' purch=' || MAX(level) FILTER (WHERE module_key = 'purchase')
           || ' payroll=' || MAX(level) FILTER (WHERE module_key = 'payroll')
           AS line
    FROM public.role_permissions
   WHERE role IN ('management', 'accounts', 'site_manager', 'site_incharge', 'viewer', 'shed_supervisor')
   GROUP BY role
) s;
