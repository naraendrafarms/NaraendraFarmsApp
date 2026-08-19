-- Migration 774: tick off what shipped on 19-Aug-2026, and rewrite the two
-- tasks that were partly done so the list stays true rather than tidy.

-- Shipped in full.
UPDATE public.tasks
   SET status = 'done'
 WHERE task_type = 'development'
   AND title IN (
     'Usage panel on the Health Check page',
     'From-To date range for Attendance, Salary and Electricity'
   );

-- The cheap half of the audit-log fix shipped. The decisions behind the rest
-- are still yours, so the task stays open with an honest description.
UPDATE public.tasks
   SET description = 'PARTLY DONE, REST WAITING ON YOU.

DONE 19-Aug-2026. Migration 772 stopped the trigger recording a save that
changes nothing. Attendance was 12,028 real rows against 432,589 update
entries, about thirty-six rewrites per row, because saving the month grid
writes back every cell whether or not it was touched. Those no-change entries
are no longer written. Real edits are recorded exactly as before, values and
all, so Undo is unaffected, and nothing already recorded was deleted.

STILL WAITING ON YOU, because both destroy or move history and that is your
call, not mine.
  1. Delete who/when entries older than 12 months. The 120-day pruning of the
     before/after values is already running.
  2. Archive old months into Supabase Storage as compressed CSV. See the
     separate task.
  3. Or Supabase Pro, which raises the limit to 8 GB and brings back
     point-in-time recovery.

Watch the effect on Admin Centre, Health Check, Supabase usage, which now
shows the database against the 500 MB limit and the audit log growth per day.
It stood at 207 MB with 166 MB of audit log when this was found.',
       priority = 'normal'
 WHERE task_type = 'development'
   AND title = 'Audit log is filling the free plan (166 MB of 207 MB)';

UPDATE public.tasks
   SET description = 'PARTLY DONE, DECISION STILL YOURS.

DONE 19-Aug-2026. The weekly snapshot step now rebases before pushing, so the
backup no longer fails when something else pushes during the export, and it
REFUSES to commit anything while the repository is public. The nightly 90-day
copy runs either way and is unaffected. First run exported 572,302 rows from
138 tables.

STILL WAITING ON YOU. Make the repository private and the weekly snapshot
starts committing by itself with no further work. Keep it public and say so,
and the backup gets moved somewhere private instead. Until then the only copy
is the 90-day one, which is also readable by anyone with the run link while
the repository stays public.'
 WHERE task_type = 'development'
   AND title = 'Nightly backup artifacts are public while the repository is public';

SELECT 'tasks' AS chk,
       count(*) FILTER (WHERE status = 'done')::int AS done,
       count(*) FILTER (WHERE status = 'pending')::int AS pending
FROM public.tasks WHERE task_type = 'development';
