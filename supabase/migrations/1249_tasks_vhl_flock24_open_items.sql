-- Two Flock 24 (VHL) items left open at the end of 16/09/2026, recorded here
-- so they do not live only in a chat transcript. Read-only apart from the
-- INSERT, which is guarded so re-running never resurrects a ticked-off task.
SELECT 1 AS warmup;

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Flock 24 VHL - the 14.09.2026 arrival of 1600 female still needs entering',
   'WAITING ON YOU. On 14/09/2026 you tried to add 1600 Received Female for Flock 24 and it did '
   || 'not save - a COUNT against vhl_daily_entry found ZERO rows for that flock on any date, so '
   || 'nothing was written. The cause of that failure is NOT known and was never reproduced. '
   || 'WHAT IS NOW BUILT AND WAITING: VHL - Bulk (Shed-wise) Daily Entry gained Recd F and Recd M '
   || 'columns on 16/09/2026, so the arrival can be entered against the SHED it came into, and '
   || 'Closing works itself out as Opening + Received - Transfer - Cull - Death. The database '
   || 'columns received_female and received_male have existed since migration 358 - only the grid '
   || 'was missing them. '
   || 'WHAT TO DO: open VHL - Bulk (Shed-wise) Daily Entry, pick Flock 24 and date 14/09/2026, put '
   || 'the birds in Recd F on the shed they went into, and press Save All. WATCH FOR THE GREEN '
   || 'TOAST. If it fails again, say so straight away - the browser console error is what will '
   || 'name the cause, and without it there is nothing to diagnose. '
   || 'Nothing has been entered on your behalf and no row has been touched.',
   'Flocks', 'high'),

  ('Flock 24 VHL - laying_start_date is not set',
   'OPEN - MINE TO DO, WAITING ON YOUR YES. Flock 24 is is_vhl_contract = true with status '
   || 'laying, and its placement_date was corrected on 16/09/2026 from 14/09/2026 to 16/05/2026 '
   || '(migration 1248, with the old value kept in flocks_placement_backup_1248) so the age reads '
   || '17 weeks 2 days on 14/09/2026, matching VHL. '
   || 'STILL UNSET: laying_start_date is NULL. Any figure worked out from weeks-in-lay rather than '
   || 'age - hen-day percentage against the laying standard, and the lay-week columns on the VHL '
   || 'reports - has no date to count from for this flock. '
   || 'WHAT IS NEEDED FROM YOU: the date VHL treats as the start of lay for Flock 24. It is one '
   || 'UPDATE on one row once you give the date, with the row copied to a backup table first. '
   || 'Nothing will be written until you say the date.',
   'Flocks', 'medium')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT count(*)::int AS open_dev_tasks_for_flock24
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'Flock 24 VHL%';
