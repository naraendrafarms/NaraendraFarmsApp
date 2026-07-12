-- Tasks module: admin tasks, monthly compliance deadlines (GST/TDS/PF/ESI),
-- and daily team task assignment. One table, task_type distinguishes the
-- three uses. Assignment can be made to a person (employee) or a site/team
-- (farm_id + team text). Tasks can optionally link back to any record in
-- the app (linked_table/linked_id/linked_label) — unlike the rest of the
-- codebase's one-FK-per-source-type convention, this is intentionally a
-- generic reference since tasks can be created from ANY page, not a fixed
-- small set of source tables; no FK constraint is possible across arbitrary
-- tables, so linked_label caches a display string for list/badge rendering.
CREATE TABLE IF NOT EXISTS public.tasks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    TEXT NOT NULL,
  description              TEXT,
  task_type                TEXT NOT NULL DEFAULT 'daily' CHECK (task_type IN ('daily','compliance','admin')),
  team                     TEXT,
  farm_id                  UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  assigned_to_employee_id  UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_to_user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  priority                 TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  due_date                 DATE,
  recurrence_rule          TEXT,
  parent_task_id           UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  linked_table             TEXT,
  linked_id                UUID,
  linked_label             TEXT,
  created_by               UUID REFERENCES public.profiles(id),
  completed_at             TIMESTAMPTZ,
  completed_by             UUID REFERENCES public.profiles(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_linked ON public.tasks (linked_table, linked_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_emp ON public.tasks (assigned_to_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON public.tasks (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks (task_type);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

SELECT 'sentinel' AS marker, 1 AS n;
SELECT count(*) AS table_created FROM information_schema.tables
WHERE table_schema='public' AND table_name='tasks';
