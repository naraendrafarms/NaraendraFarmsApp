INSERT INTO public.tasks (title, description, task_type, status, priority, team)
SELECT
  'Download a local data backup',
  'WAITING ON YOU: monthly reminder to click Admin Centre -> Data Backup -> Download Full Backup and save the .xlsx somewhere off Supabase (it does not use the 1GB plan storage). New page: /admin/backup.',
  'development', 'pending', 'normal', 'Housekeeping'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE task_type='development' AND title = 'Download a local data backup'
);

SELECT 'backup_task_seeded' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title = 'Download a local data backup';
