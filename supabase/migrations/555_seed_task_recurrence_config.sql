-- Moves the Task Recurrence dropdown from a hardcoded list
-- (RECURRENCE_PRESETS in src/lib/tasks.ts) into config_options, so it can be
-- managed from Admin Centre → Masters → Tasks like every other dropdown in
-- the app — the user wants to add more compliance recurrences (GST, TDS,
-- ESI, PF, PT, etc.) without a code change each time.
-- Seeds the exact same 7 entries that were previously hardcoded, so nothing
-- changes for existing tasks/behavior until the admin adds more.
INSERT INTO public.config_options (grp, value, label, sort_order, is_active) VALUES
  ('task_recurrence', '',             'One-time (no recurrence)',             1, TRUE),
  ('task_recurrence', 'daily',        'Daily',                                 2, TRUE),
  ('task_recurrence', 'monthly:7',    'Monthly — 7th (e.g. TDS payment)',      3, TRUE),
  ('task_recurrence', 'monthly:15',   'Monthly — 15th',                        4, TRUE),
  ('task_recurrence', 'monthly:20',   'Monthly — 20th (e.g. GSTR-3B)',         5, TRUE),
  ('task_recurrence', 'quarterly:31', 'Quarterly — 31st (e.g. TDS return)',    6, TRUE),
  ('task_recurrence', 'yearly:03-31', 'Yearly — 31 March',                     7, TRUE)
ON CONFLICT (grp, value) DO NOTHING;

SELECT 'sentinel' AS marker, 1 AS n;
