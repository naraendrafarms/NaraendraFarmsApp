-- Migration 763: the recovery plan on the Development list — what shipped
-- today, what is next, and what the free plan cannot give us.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, v.status, v.priority
FROM (VALUES
  ('Recovery step 1-2: audit values and undo — DONE 18/08/2026',
   'DONE. The audit log now stores the row as it WAS and as it BECAME on every insert, update and delete across 30 tables. The Audit Log page expands each entry into a field-by-field list (was / became) and carries an Undo button that puts the record back. Undo is admin only, enforced by the database function fn_undo_audit rather than only on screen, is itself audited, and refuses an entry that has already been undone. Entries from before today show a dash instead of a button, because their values were never kept. Values are pruned after 120 days to protect the free plan''s database size; the who/when/what line is kept for ever.',
   'Housekeeping', 'done', 'high'),
  ('Recovery step 5: nightly backup off the database — DONE 18/08/2026',
   'DONE. Every night at 02:30 IST every table is exported to CSV and kept away from Supabase: a 90-day workflow artifact holding everything including the audit trail, and a compressed weekly snapshot committed to the repository so there is a permanent versioned copy off Supabase entirely. Tables are read in pages so a backup can never be silently truncated. This carries more weight than usual because the free plan has no point-in-time recovery.',
   'Housekeeping', 'done', 'high'),
  ('Recovery step 3: soft delete on the main tables',
   'OPEN. A delete today destroys the row; only the audit log remembers it, and only for 120 days. Marking rows deleted instead (deleted_at) makes a wrong deletion reversible from the app and keeps the record for the nightly export. Applies to daily_records, nhe_sales, he_dispatch, hatch_batches, grn, cash_book, feed_production_log and the other transaction tables — masters can keep hard delete.',
   'Housekeeping', 'pending', 'high'),
  ('Recovery step 4: period lock after month end',
   'WAITING ON YOUR RULE. Once a month is closed nobody but admin should be able to change it — the single biggest control with 20-30 people entering data, because it stops last quarter''s figures moving under a report that has already been read. Proposed: site staff may edit until the 5th of the following month, accounts until the 10th, admin always. Confirm or change those two dates and it can be built.',
   'Housekeeping', 'pending', 'high'),
  ('Recovery step 6: point-in-time recovery is not on the free plan',
   'NOT AVAILABLE. Rolling the whole database back to a moment in time is a paid Supabase feature; on the free plan it does not exist. The nightly export (step 5) is the substitute, and the difference matters: an export restores yesterday''s state, not this afternoon''s, so a bad morning would cost the morning''s entries. If the farm ever moves to a paid plan, enable PITR and this becomes a real safety net rather than a daily one.',
   'Housekeeping', 'pending', 'low')
) AS v(title, description, team, status, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

UPDATE public.tasks SET completed_at = now()
WHERE task_type = 'development' AND status = 'done' AND completed_at IS NULL;

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';
