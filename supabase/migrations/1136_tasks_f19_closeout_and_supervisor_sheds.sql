-- Migration 1136: record what is left open after the line entry build.
--
-- Both found while checking Agraharam for the line entry page. Neither is
-- touched here -- they are written down so they are not left in a chat.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Flock 19 is closed but 9 sheds were never zeroed',
   'OPEN - MINE TO DO, WAITING ON YOUR GO-AHEAD. Flock 19 status is closed, but nine sheds still carry birds on their last daily record and none shows a transfer-out or cull: '
   || 'Agraharam Potlapally shed 1 (02/06/2026) 9,021F/930M, shed 2 (02/06) 9,227F/941M, shed 3 (04/06) 8,322F/947M, shed 4 (13/06) 8,043F/444M; '
   || 'Kethireddypally sheds 5, 6, 10, 11 and 12, all dated 09/04/2025, holding 10,113F / 7,308F / 13,775F / 3,640F+5,169M / 9,540F. '
   || 'Entry simply stopped rather than the sheds being run down to zero. '
   || 'EFFECT: v_flock_summary sums closings on the flock''s single MAX record date, which for Flock 19 is 13/06/2026 (shed 4), so the flock currently reads as 8,043F/444M rather than nil. '
   || 'FIX would be the same shape as migration 1123 for Flock 22: chain triggers off, insert a close-out row per shed on the correct date copying each shed''s own closing to transfer-out, triggers back on, verify against flock_transfers. '
   || 'WAITING ON YOU: the date each shed was actually emptied, and whether the birds were sold, culled or transferred - the close-out has to say which.',
   'Flocks', 'normal'),
  ('Shed supervisors are not restricted to their own sheds',
   'OPEN - DEFERRED, NOT A BLOCKER. profile_sheds exists (per-user shed assignment) and is EMPTY, and Line Daily Entry does not read it, so any shed supervisor sees every line-managed shed. '
   || 'With only Agraharam Potlapally sheds 1-4 switched on at one site this is harmless. It matters once a second site goes line-managed, or once supervisors are meant to see only their own shed. '
   || 'TO BUILD: a shed picker on the user form in Admin -> User Management writing profile_sheds, plus a filter on Line Daily Entry and a matching row policy so the restriction holds in the database too, not only on screen. '
   || 'WAITING ON YOU: confirm you actually want supervisors limited to assigned sheds rather than seeing the whole site.',
   'Flocks', 'low')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t
  WHERE t.title = v.title AND t.task_type = 'development'
);

-- VERIFY: both tasks present exactly once; the line entry task from 1131 is
-- still there; nothing else disturbed.
SELECT count(*)::int AS these_two,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type = 'development' AND status = 'pending') AS pending_dev_tasks
FROM public.tasks
WHERE task_type = 'development'
  AND title IN ('Flock 19 is closed but 9 sheds were never zeroed',
                'Shed supervisors are not restricted to their own sheds');
