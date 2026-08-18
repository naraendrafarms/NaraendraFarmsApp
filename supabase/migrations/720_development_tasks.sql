-- Migration 720: "development" as a real task type, admin-only, and the
-- pending list loaded into it.
--
-- The list of what is still outstanding lived only in chat, so answering
-- "what is left?" meant scrolling a transcript — and a transcript ages while
-- the work moves on. Tasks already has status, priority, due date, assignment,
-- the dashboard widget and the header badge; the only thing missing was these
-- items and a type to hold them.
--
-- Visibility is enforced HERE, not only on screen: a development task is
-- readable, writable and deletable by admin alone. A policy that hides a row
-- on the page but serves it to anyone who asks the database is not privacy.

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN ('daily','compliance','admin','development'));

DROP POLICY IF EXISTS tasks_select ON public.tasks;

CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (
  (
    task_type <> 'development'
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  AND (
    NOT is_private
    OR created_by = auth.uid()
    OR assigned_to_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
);

DROP POLICY IF EXISTS tasks_insert ON public.tasks;

CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated WITH CHECK (
  task_type <> 'development'
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS tasks_update ON public.tasks;

CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated USING (
  task_type <> 'development'
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS tasks_delete ON public.tasks;

CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated USING (
  task_type <> 'development'
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- The pending list. Seeded once — re-running this migration adds nothing back
-- that has since been ticked off, because each row is matched on its title.
INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Shed line-wise boxes (A/B/C/D sides)',
   'WAITING ON YOU: the line sheet — Site, Shed No, Side (A/B/C/D), Line No, Boxes, and birds per box or capacity female/male. The tables (shed_lines, line_production, line_mortality, line_feed), the shed supervisor role and the per-shed line_managed switch are all built and empty. NOTE: the side rule currently accepts only A and B, and the shed capacity sheet has only A/B box columns — both must widen to A-D before four-sided data can load. Also confirm whether every shed has four sides, and whether line numbers restart on each side.',
   'Farm Data', 'high'),
  ('Feed type mapping: L1-L5 to BRE 1 / BRE 2',
   'WAITING ON YOU: which of L1, L2, L3, L4, L5 correspond to BRE 1 and BRE 2. Blocks the standard-versus-actual feed comparison. CF-BCM, GF-BGM, DF-BDM, PBF-PBM and MF-MALE are already clear.',
   'Feed', 'high'),
  ('Confirm 5 flagged rows in the breed standards sheet',
   'WAITING ON YOU: winter laying week 40 nutrients; winter egg week 48 chick weight; summer egg mass weeks 64-65; the repeated male laying rows; the blank week 24 cells. Everything else in the sheet is loaded and checked.',
   'Standards', 'normal'),
  ('Manpower Requirement — type the required counts',
   'WAITING ON YOU: the master is built and EMPTY, so every site reads as short by its whole staff. Enter required count per site, designation and gender under Employees > Manpower Requirement. Actual is counted from the employee records automatically.',
   'HR', 'normal'),
  ('Body weight Excel for the remaining flocks',
   'WAITING ON YOU: the import template is ready; only Flock 23 week 1 has been loaded so far.',
   'Flocks', 'normal'),
  ('Flock 23 — laying season, and optional week 0',
   'WAITING ON YOU: laying season is not set. It is needed from about week 24 (late Jan 2027) or the Standard column will show a dash from that week onward. Optional: the 46 g day-old chick weight as week 0, which would give a gain figure from week 1.',
   'Flocks', 'normal'),
  ('Egg Age tab — link hatch batches to dispatches',
   'OPEN: 0 of 394 hatch batches are linked to a dispatch, so egg age cannot be worked out for any of them. Needs a decision on how a batch is matched to the dispatch it came from.',
   'Hatchery', 'normal'),
  ('Money tab — chick rate not entered',
   'WAITING ON YOU: a chick rate needs typing before the money figures mean anything.',
   'Hatchery', 'normal'),
  ('Vaccine and medicine negative stock balances',
   'DEFERRED BY YOU: ND KILLED -1,02,000; NoBills IB MA5 -70,500; Avipro Thymovac -52,500; ILT -50,000; PNewmo -41,000, plus smaller ones. Each is usage recorded against stock that was never received, so either the purchase is missing or the usage is overstated.',
   'Inventory', 'normal'),
  ('40 Degree — 22 kg negative after the feed backfill',
   'OPEN: the only ingredient left negative after the April-August production backfill, and it is a purchase-side gap rather than a production one. Small, but it means a GRN or an opening entry is missing.',
   'Feed', 'low'),
  ('Payment Planning — plan versus actual screen',
   'NOT BUILT: a saved plan can be opened and printed, but there is nowhere to compare what was planned against what was actually paid.',
   'Accounts', 'low'),
  ('Physical Stock Audit — first real count',
   'READY TO USE: Inventory > Physical Audit was built on 17/08/2026 and has never been used with a real count. Enter one audit end to end and check the adjustment and the flock expense it produces before trusting it.',
   'Inventory', 'normal'),
  ('4 backup tables have RLS enabled with no policy',
   'NOTED, HARMLESS: they are backups, nothing reads them. Worth clearing up so a future reader does not mistake them for broken tables.',
   'Housekeeping', 'low')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

NOTIFY pgrst, 'reload schema';
