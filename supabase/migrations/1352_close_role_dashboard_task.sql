-- The role/dashboard task is done. UPDATEs a live row, so the row is COPIED
-- FIRST, in this migration, before the write.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1352 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';

UPDATE public.tasks
   SET status = 'done',
       description = description
     || E'\n\n--- SHIPPED 22/09/2026 ---\n'
     || '1. DASHBOARD: every panel now declares the module it needs and renders only for a role holding it, reusing role_permissions rather than a second rule set. '
     || 'Total HE Revenue and the per-flock revenue line moved to reports_financial - that was the leak, and it appeared twice. Queries are SKIPPED when a panel is hidden, '
     || 'the page waits for permissions before drawing so nothing flashes, a site in-charge now sees their own site (farmId in the query key so the cache cannot cross users), '
     || '"All systems normal" speaks only for what the role can see, and a role with nothing to show gets a sentence instead of a blank page. '
     || '2. ROLE TYPE and can.* helpers: purchase_officer gets editPurchase but NOT approvePayment; auditor gets viewBankLedger and viewPlanning to match the module grants it '
     || 'already held; viewAllSites inverted so a future role cannot be forgotten. '
     || '3. BOTH ADMIN CENTRE LISTS: Users offers all seven; Access Control shows all fourteen roles including SHED_SUPERVISOR, which was never listed and so could not be edited there at all. '
     || '4. STATIC NAV GATES ALIGNED - the sidebar needs BOTH the fixed roles array and the module permission, so the doctor would have held masters=read_only and still been unable to '
     || 'reach the vaccination schedule. Fixed for all seven. '
     || 'GRN was split into its own module (1351) so the store keeper receives stock without seeing PO prices. Nothing changed for any existing role. '
     || 'ONE THING LEFT WITH THE OWNER: the auditor can open the BANK LEDGER. That follows its accounts=read_only grant, but it is the only new role with bank sight - say if it should be closed.'
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles'
   AND status <> 'done';

SELECT left(title, 45) AS title, status FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';
