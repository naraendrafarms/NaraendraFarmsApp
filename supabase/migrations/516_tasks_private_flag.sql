-- Tasks: add a private flag so a task a user creates purely for themselves
-- doesn't show up to everyone else under "All Tasks" — only to its creator,
-- whoever it's assigned to, and admin. Creation itself stays open to any
-- authenticated user; this only narrows visibility, per user's explicit
-- clarification (anyone can create, but self-only tasks shouldn't be public).
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (
  NOT is_private
  OR created_by = auth.uid()
  OR assigned_to_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

SELECT 'sentinel' AS marker, 1 AS n;
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='tasks' AND column_name='is_private';
