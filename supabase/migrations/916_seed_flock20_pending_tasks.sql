-- Migration 916: seed pending Flock 20 follow-up items into public.tasks,
-- guarded so re-running never resurrects an already-ticked-off item.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT 'Flock 20: 1 row still missing (2025-11-12, Kethireddypally shed 2)',
       'DEFERRED BY YOU. The Flock 20 daily-records import is 2390 of 2391 rows complete (0 formula mismatches, 0 duplicates). One single row -- Kethireddypally shed 2, 2025-11-12 -- silently failed to insert across 5+ attempts (individual insert, small batches, with RETURNING, checked for CHECK constraints -- none found) with no visible error each time. Root cause not found. It is a one-day gap for one shed; does not affect any chart/report materially. Needs direct DB shell access (not available via the GitHub-Actions migration pipeline) to diagnose further, or can simply be left as a known small gap.',
       'development', 'Flocks', 'low', 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE title = 'Flock 20: 1 row still missing (2025-11-12, Kethireddypally shed 2)' AND task_type = 'development'
);

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT 'Flock 20: grade-wise hatching egg import (HE Grade sheet) not done',
       'OPEN. Flock_20.xlsx has an "HE Grade" sheet (Date/Week/Day, A/B/C grade Opening-Received-Dispatch-Closing, Totals) that has not been imported. Checked the real app schema: daily_records.he_grade_a/b/c = daily Received counts per grade (needs an UPDATE to the Flock 20 rows already imported, matched by date -- not a new insert); egg_opening_stock.he_grade_a/b/c = one-time opening balance per flock (only needed if the flock''s first tracked day has nonzero opening); he_dispatch/he_dispatch_lines.grade_a/b/c = real HE sale records tied to buyer/price data from the separate "HE Sales" sheet. WAITING ON YOU: you asked me to check the "Egg" sheet specifically (not HE Grade), but the uploaded Flock_20.xlsx file has since been cleared from session storage -- need you to re-upload it before this can be finished.',
       'development', 'Hatchery', 'medium', 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE title = 'Flock 20: grade-wise hatching egg import (HE Grade sheet) not done' AND task_type = 'development'
);

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT 'Flock 20: Kethireddypally-to-Bodjanampet-1 shed transfer not logged in flock_transfers',
       'DEFERRED BY YOU. Bird-count math for the Kethireddypally-held-back-birds shift to Bodjanampet-1 is fully correct (captured via each shed''s own opening/closing/received/cull figures in the imported daily_records rows). No flock_transfers row was created for this move, on your explicit instruction ("ok leave it for now"), because trg_flock_transfer_credit (the same trigger that caused the Flock 19 double-credit bug this session) would need very careful handling to add safely. Consequence: this move will not show as a line item on the app''s Transfers tab, though all counts elsewhere are correct. Revisit only if you want it visible there.',
       'development', 'Flocks', 'low', 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE title = 'Flock 20: Kethireddypally-to-Bodjanampet-1 shed transfer not logged in flock_transfers' AND task_type = 'development'
);

SELECT 'tasks_seeded' AS chk, count(*)::int AS n FROM public.tasks
 WHERE title IN (
   'Flock 20: 1 row still missing (2025-11-12, Kethireddypally shed 2)',
   'Flock 20: grade-wise hatching egg import (HE Grade sheet) not done',
   'Flock 20: Kethireddypally-to-Bodjanampet-1 shed transfer not logged in flock_transfers'
 ) AND task_type = 'development';
