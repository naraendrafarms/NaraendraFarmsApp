-- Findings from the free-tier review of 15/09/2026, recorded so they do not
-- live only in a chat transcript. All measured, none guessed: GitHub Actions
-- from 376 real runs over 15 days with their real durations, and the database
-- from pg_total_relation_size.
INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('GitHub Actions is at 80 percent of the free allowance - two easy cuts',
   'OPEN - WAITING ON YOUR YES. MEASURED, not estimated: September 1-15 ran 376 workflows for 800 '
   || 'billed minutes, so about 1,600 a month. A PUBLIC repo gets unlimited free minutes, so this '
   || 'costs nothing today - but a PRIVATE repo gets 2,000 a month, which is 80 percent used. '
   || 'WHAT HAPPENS IF IT IS EXCEEDED: on the free plan the spending limit is 0 dollars by default, '
   || 'so there is NO BILL - Actions simply STOPS until the month resets, which would halt migrations '
   || 'and deploys mid-month. '
   || 'THE BREAKDOWN per month: Build and Deploy 650, Nightly Backup 430, Apply Migration 254, '
   || 'Code Check 236, Health Check 30. Note GitHub rounds EVERY job up to a whole minute, so a '
   || '22-second migration still costs one. '
   || 'THE TWO CUTS: (1) 161 deploys ran against 126 migrations - a migration-only push changes no '
   || 'frontend code, yet triggers a full npm ci, build, Cloudflare deploy AND a Code Check. Skipping '
   || 'both when only supabase/migrations is touched saves roughly 400-500 minutes a month. '
   || '(2) Nightly Backup takes 827 SECONDS a night, 14 billed minutes, for what is only a CSV export '
   || '- worth finding out why. Both together bring it to about 800-900 a month, under half. '
   || 'These are workflow-file changes only. No database, no live data.',
   'Housekeeping', 'high'),

  ('Audit log is 240 MB of the 291 MB database - 82 percent',
   'OPEN. The database is 291 MB of the 500 MB free limit. audit_log alone is 240 MB across 584,598 '
   || 'rows - 82.4 percent of everything. ALL the real farm data - every flock, sale, salary, invoice '
   || 'and cash entry since June - is about 51 MB. '
   || 'DAILY ENTRY IS NOT THE PROBLEM: the last 30 days added 7,881 attendance rows, 560 daily '
   || 'records, 317 cash book, 147 NHE sales and 12 dispatches. A couple of MB a month. '
   || 'GROWTH BY MONTH: June 20,556 rows, July 250,484, August 298,299, September 15,259 in 15 days. '
   || 'September collapsed because migration 772 stopped logging changes where nothing actually '
   || 'changed. The July/August bulge was bulk imports, each writing one audit row per row loaded. '
   || 'PROJECTION at today rate: about 15 MB a month, so roughly 14 months of headroom. Daily farm '
   || 'entry on its own would take years to fill 500 MB. '
   || 'THE RELEASE VALVE, WAITING ON YOUR DECISION: the nightly backup already archives the audit log '
   || 'off-site for 90 days, so pruning audit rows older than 90 days from the DATABASE would free '
   || 'over 100 MB at once without losing the history. Nothing will be pruned without your say-so - '
   || 'the audit log is also what Admin Centre undo reads.',
   'Housekeeping', 'normal'),

  ('Check DB Storage report cannot list tables - its query is broken',
   'OPEN - MINE TO FIX. Admin workflow check-storage.yml reports the database total correctly but its '
   || 'per-table section fails every run with: column "tablename" does not exist. It selects tablename '
   || 'where the catalogue it queries does not have that column. So the breakdown of WHAT is using the '
   || 'space has never once been visible - which is why the audit log sitting at 82 percent of the '
   || 'database went unnoticed until it was measured by hand on 15/09/2026. Small fix in '
   || 'scripts/check_storage.py, and it makes the storage report actually useful.',
   'Housekeeping', 'low'),

  ('medicine_usage carries 4 MB of indexes on a 160 kB table',
   'OPEN - MINE TO LOOK AT. medicine_usage holds 856 rows in 160 kB, with 4,008 kB of indexes and '
   || 'toast on top - a 25 times overhead, and 4.2 MB total, which puts it among the five largest '
   || 'objects in the database despite being one of the smallest tables. Almost certainly redundant '
   || 'or duplicated indexes. Not urgent at 291 MB of 500, but it is free space to recover and the '
   || 'same pattern may exist on other small tables.',
   'Housekeeping', 'low')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development');

SELECT title, priority, team, status FROM public.tasks
WHERE task_type = 'development' AND created_at >= now() - interval '5 minutes'
ORDER BY priority DESC;

SELECT count(*)::int AS open_development_tasks
FROM public.tasks WHERE task_type = 'development' AND status <> 'done';
