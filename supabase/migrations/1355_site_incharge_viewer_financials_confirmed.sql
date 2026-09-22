-- The owner confirmed 22/09/2026: SITE INCHARGE AND VIEWER KEEP their financial
-- and payroll sight. No permission cell changes and no code changes - this only
-- records the decision, because a reader who finds a site in-charge looking at
-- company revenue will otherwise assume it is an oversight and close it.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1355 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';

UPDATE public.tasks
   SET description = description
     || E'\n\n--- CONFIRMED BY OWNER 22/09/2026 (site_incharge / viewer) ---\n'
     || 'MEASURED after the dashboard shipped: site_incharge and viewer both hold reports_financial=full AND payroll=full, so they see Total HE Revenue, the revenue line on each '
     || 'flock card, and the Salary Entry shortcut. site_manager holds reports_financial=hidden and payroll=hidden, so for THAT role the dashboard change closed the leak. '
     || 'THE OWNER WAS ASKED AND CHOSE TO LEAVE BOTH AS THEY ARE. This is a deliberate setting, NOT an oversight - do not close it. '
     || 'The dashboard is behaving correctly either way: it obeys role_permissions rather than a second rule set, so changing these is a cell in Admin Centre -> Access Control and needs no deploy. '
     || 'What the dashboard change DID fix for site_incharge regardless: their flock list, bird counts and chart are now filtered to their OWN SITE, where before every role saw the whole company.'
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles'
   AND description NOT LIKE '%site_incharge / viewer%';

SELECT left(title, 40) AS title, status,
       (description LIKE '%CHOSE TO LEAVE BOTH AS THEY ARE%') AS decision_recorded
  FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';
