-- Migration 767: record the free-plan storage finding as a development task.
-- Measured 19-Aug-2026: database 207 MB of the free plan's 500 MB, and 166 MB
-- of that is audit_log alone — 535,086 entries in two months, 444,617 of them
-- on attendance_daily (a table holding only 12,028 real rows). Left alone this
-- reaches 500 MB inside about two months and the database stops accepting
-- writes. Nothing is broken today; this is the decision that has to be taken.

INSERT INTO public.tasks (title, description, task_type, team, priority, status, created_at)
SELECT
  'Audit log is filling the free plan (166 MB of 207 MB)',
  'WAITING ON YOU — a decision, not data.

Measured 19-Aug-2026 by migrations 764/765/766:
  * Database total: 207 MB of the free plan''s 500 MB.
  * audit_log: 166 MB (96 MB table + 70 MB indexes), 535,086 entries,
    oldest 17-Jun-2026 — so two months of history is already four fifths of
    everything stored.
  * 444,617 of those entries (83%) are attendance_daily, a table with only
    12,028 real rows. Saving a month''s attendance grid rewrites every
    employee-day row, and each rewrite writes an audit entry.
  * Current rate: about 19,000 entries a day (131,975 in the last 7 days).
    At roughly 325 bytes an entry that is ~6 MB a day, so the 293 MB of
    headroom is gone in about two months. From migration 761 each entry also
    carries the before/after values, which makes every new entry several times
    larger than the ones measured here.
  * File storage is effectively unused (288 KB), and the nightly backup lives
    in GitHub, not Supabase — so the database size is the only pressure.

Three ways out, cheapest first — pick one and it gets built:
  1. Stop attendance re-saves writing an entry when nothing actually changed
     (compare OLD and NEW in fn_audit_log and skip identical rows). Removes
     most of the 19,000 a day at no loss of real history.
  2. Keep who/when entries for 12 months and delete older ones, alongside the
     120-day value pruning already in place (fn_prune_audit_values).
  3. Upgrade to the Supabase Pro plan (8 GB, and point-in-time recovery — the
     one thing the free plan cannot give us).

Until one of these is chosen the log keeps growing at 6 MB a day.',
  'development', 'Housekeeping', 'high', 'pending', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks
   WHERE title = 'Audit log is filling the free plan (166 MB of 207 MB)'
     AND task_type = 'development'
);

SELECT 'seeded' AS chk, count(*)::int AS n
FROM public.tasks
WHERE title = 'Audit log is filling the free plan (166 MB of 207 MB)';
