-- The owner confirmed 22/09/2026: THE AUDITOR CAN SEE THE BANK LEDGER.
-- That is what shipped, so no code and no permission cell changes. This only
-- records the confirmation, because the alternative is someone reading the
-- open question left on the task and "tightening" a setting the owner chose.
--
-- Verify first, read only: the auditor's accounts grant is what the code's
-- can.viewBankLedger agrees with. If these two ever disagree the page would
-- refuse a module the admin had granted - the bug class that put company
-- revenue on a shed supervisor's dashboard.
SELECT string_agg(role || '.accounts=' || level, ' | ' ORDER BY role) AS accounts_grants
  FROM public.role_permissions
 WHERE module_key = 'accounts' AND role IN ('auditor', 'accounts', 'purchase_officer', 'store_keeper');

-- Record it. UPDATEs a live row, so the row is COPIED FIRST, before the write.
CREATE TABLE IF NOT EXISTS public.tasks_backup_1353 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';

UPDATE public.tasks
   SET description = description
     || E'\n\n--- CONFIRMED BY OWNER 22/09/2026 ---\nTHE AUDITOR CAN SEE THE BANK LEDGER. This was the one question left open when the role work shipped; the owner confirmed it. '
     || 'No change was needed - can.viewBankLedger already allows admin, accounts and auditor, matching the auditor accounts=read_only grant from migration 1348. '
     || 'DO NOT "tighten" this later: it is a deliberate choice, not an oversight. An auditor reads the books, and the bank ledger is the books. '
     || 'The auditor still enters nothing anywhere (it is absent from ENTRY_ROLES) and cannot approve a payment. No other new role has bank sight: purchase_officer is accounts=hidden on purpose, '
     || 'which is the entire reason that role exists instead of handing someone the accounts role.'
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles'
   AND description NOT LIKE '%CONFIRMED BY OWNER 22/09/2026%';

SELECT left(title, 40) AS title, status,
       (description LIKE '%AUDITOR CAN SEE THE BANK LEDGER%') AS confirmed
  FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';
