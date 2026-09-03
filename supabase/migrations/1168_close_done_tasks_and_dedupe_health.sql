-- Migration 1168: tidy the development task list, confirmed by the owner.
--
-- Three things, all agreed before running:
--
--  1. Four tasks that shipped this session are marked done.
--  2. The ten nightly "Health check found 1 critical problem(s) on <date>"
--     tasks are collapsed to ONE standing task, and the nightly job is stopped
--     from raising a new one while an open one is already sitting there.
--  3. Task 15's figure is corrected from 225 to 233 -- the rule now counts 233.
--
-- Nothing outside public.tasks is touched. No farm data, no money row.

-- [1] The four that are built and pushed.
UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 03/09/2026: Line Data Entry (Flocks) records birds, eggs per round, morning and day mortality, feed per line and line-to-line transfers, entirely separate from daily_records. Line Reports sits under Reports.'
WHERE task_type = 'development' AND status <> 'done'
  AND title = 'Line-wise daily entry screen (parallel to Bulk Daily Entry)';

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 03/09/2026: a shed supervisor now sees only the sheds listed against them in profile_sheds; more than one supervisor may share a shed. Saves still cover the whole shed, not just the side being viewed.'
WHERE task_type = 'development' AND status <> 'done'
  AND title = 'Shed supervisors are not restricted to their own sheds';

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 03/09/2026: boxes_female and boxes_male carry the real box counts (migration 1130 -- they had been loaded into the capacity columns by mistake), and the A/B/C/D side dropdown is on both Line Data Entry and Line Reports.'
WHERE task_type = 'development' AND status <> 'done'
  AND title = 'Shed line-wise boxes (A/B/C/D sides)';

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 03/09/2026: eight imprest accounts (HO, Mandal, the two named holders, and one per site), Imprest Ledger with voucher entry and transfers, imprest-to-bank both legs paired by transfer_group_id, tick boxes with edit and delete on the accounts screen, and a Paid from (Imprest) box on Farm Expenses. OPENING BALANCES ARE STILL TO BE TYPED BY YOU -- three accounts read negative until then; that is tracked separately, not here.'
WHERE task_type = 'development' AND status <> 'done'
  AND title = 'Cash imprest accounts and internal transfers';

-- [2a] Collapse the nightly duplicates. The newest one survives and becomes the
-- standing entry; the older ones are closed as superseded, NOT as fixed -- the
-- underlying rule is still failing and the standing task says so.
UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nCLOSED 03/09/2026 AS A DUPLICATE, NOT AS FIXED: the nightly job raised one of these every night for the same single failing rule. They are collapsed into one standing task, which stays open while the rule fails.'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title LIKE 'Health check found%'
  AND id <> (SELECT id FROM public.tasks
             WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
               AND title LIKE 'Health check found%'
             ORDER BY created_at DESC, id DESC LIMIT 1);

-- [2b] The survivor becomes a standing, dated-free entry.
UPDATE public.tasks
SET title = 'Health check: critical rule failing (bird count does not add up)',
    description = 'STANDING TASK. Raised by the nightly health check and kept open while any critical rule fails, instead of a fresh task every night. As at 03/09/2026 the failing critical rule is "Days where the bird count does not add up" -- 7 rows, the same tiny 1-4 bird drifts on Flock 20 (19/10/2025 to 02/11/2025) confirmed earlier against the source Excel as import noise. Also failing below critical: salary paid with no attendance (20), negative stock (20), stock movements not linked to an item (13), VHL bird count (7). Check the Health Check page for the live figures.',
    priority = 'high', team = 'Housekeeping'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title LIKE 'Health check found%';

-- [2c] Stop the nightly job raising another. fn_run_health_checks guards on
-- "no task created TODAY", which is why there is one per day. This trigger
-- refuses the insert while ANY health-check task is still open, so the standing
-- one is the only one there can be. A trigger is used rather than rewriting the
-- 200-line check function, which would risk the rules themselves.
CREATE OR REPLACE FUNCTION public.fn_one_open_health_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_type = 'development'
     AND (NEW.title LIKE 'Health check found%' OR NEW.title LIKE 'Health check:%')
     AND EXISTS (SELECT 1 FROM public.tasks t
                 WHERE t.task_type = 'development'
                   AND COALESCE(t.status,'pending') <> 'done'
                   AND (t.title LIKE 'Health check found%' OR t.title LIKE 'Health check:%'))
  THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_one_open_health_task ON public.tasks;
CREATE TRIGGER trg_one_open_health_task
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_one_open_health_task();

-- [3] The bird-sales figure, corrected to what the rule actually counts today.
UPDATE public.tasks
SET title = '233 old bird sales carry no shed',
    description = description || E'\n\nRECOUNTED 03/09/2026: the health check now reports 233, not 225 -- eight more have been added since this was written. Still open.'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title = '225 old bird sales carry no shed';

-- VERIFY 1: the four are closed, exactly one health task is open, and the
-- bird-sales one was renamed.
SELECT (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND status='done'
          AND title IN ('Line-wise daily entry screen (parallel to Bulk Daily Entry)',
                        'Shed supervisors are not restricted to their own sheds',
                        'Shed line-wise boxes (A/B/C/D sides)',
                        'Cash imprest accounts and internal transfers')) AS four_closed,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
          AND (title LIKE 'Health check found%' OR title LIKE 'Health check:%')) AS open_health_tasks,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
          AND title = '233 old bird sales carry no shed') AS bird_sales_renamed;

-- VERIFY 2: the new open count, and that the trigger is on and enabled.
SELECT count(*) FILTER (WHERE COALESCE(status,'pending') <> 'done')::int AS open_dev_now,
       count(*) FILTER (WHERE status = 'done')::int AS done_dev_now,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgname = 'trg_one_open_health_task' AND tgenabled::text = 'O') AS guard_enabled
FROM public.tasks WHERE task_type = 'development';
