-- The owner decided 22/09/2026: the DOCTOR SEES the vaccination schedule,
-- ACCOUNTS MAINTAINS it. That is exactly what migration 1348 already seeded
-- (doctor masters=read_only), so no module split is needed and nothing about
-- the permission matrix changes. This records the decision on the task so it
-- is not re-opened, and verifies the two cells that carry it.

-- 1. Verify, read only: can accounts actually maintain it, and is the doctor
--    held to read only? If accounts is not 'full' on masters the decision
--    cannot be carried out and that needs saying, not assuming.
SELECT string_agg(role || '.' || module_key || '=' || level, ' | ' ORDER BY role) AS vaccination_cells
  FROM public.role_permissions
 WHERE module_key = 'masters' AND role IN ('accounts', 'doctor', 'admin');

-- 2. Record the decision on the task. This UPDATEs a live row, so the row is
--    COPIED FIRST, in this migration, before the write.
CREATE TABLE IF NOT EXISTS public.tasks_backup_1350 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';

UPDATE public.tasks
   SET description = description
     || E'\n\n--- DECIDED 22/09/2026 ---\nVACCINATION SCHEDULE: the doctor SEES it, ACCOUNTS MAINTAINS it. '
     || 'So NO module split is needed - doctor masters=read_only as already seeded in 1348 is correct, and the question raised there is closed. '
     || 'Do NOT give the doctor masters=full when wiring the role. The store_keeper / GRN compromise is still open and unanswered.'
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles'
   AND description NOT LIKE '%DECIDED 22/09/2026%';

SELECT left(title, 45) AS title, status,
       (description LIKE '%ACCOUNTS MAINTAINS it%') AS decision_recorded
  FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Role-aware dashboards, and wire up the seven new roles';
