-- Line-wise VHL recording, asked for on 16/09/2026 as a future need. Written
-- down now, with what was actually found in the schema, so the decision is
-- not re-derived from scratch later.
SELECT 1 AS warmup;

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('VHL needs line-wise recording - it has shed only, no lines at all',
   'OPEN - NOT BUILT, WAITING ON YOUR DECISION. You said on 16/09/2026 that line-wise is needed in '
   || 'future for VHL. MEASURED AGAINST THE REAL SCHEMA, not assumed: '
   || 'REGULAR FLOCKS ALREADY HAVE A FULL LINE SYSTEM - shed_lines (migration 638) plus its own '
   || 'tables line_production, line_mortality, line_feed, line_placements, line_transfers and the '
   || 'v_line_balance view, a line_id on medicine_usage (migration 642), and a whole Line Daily '
   || 'Entry page. Lines are NOT a column on the daily table there; they are a separate set of '
   || 'tables sitting beneath the shed. '
   || 'VHL HAS NONE OF IT. vhl_daily_entry carries shed_id and nothing else - there is no line_id, '
   || 'and no vhl_line_* table exists. So line-wise VHL is a build, not a switch. '
   || 'TWO WAYS TO DO IT, and the choice decides how much work it is: '
   || '(1) ADD line_id TO vhl_daily_entry and let the Bulk grid show a row per line within a shed. '
   || 'Cheapest by far - one column, one migration, the existing grid gains a Line column, and '
   || 'every existing shed row stays valid with line_id NULL meaning whole shed. It gives '
   || 'line-wise feed, mortality, eggs and bird counts. It does NOT give the line placement and '
   || 'line transfer machinery the regular side has. '
   || '(2) MIRROR THE REGULAR LINE TABLES for VHL - full parity, line balances, transfers between '
   || 'lines, the lot. Much bigger, and worth it only if VHL reporting genuinely needs line '
   || 'balances rather than just line-wise daily figures. '
   || 'WHAT IS NEEDED FROM YOU: which of the two, and whether VHL sheds reuse the SAME shed_lines '
   || 'rows the regular side uses (the sheds themselves are shared - Bodjanampet-2 sheds 1 to 4) '
   || 'or need their own. Nothing will be built or migrated until you say. '
   || 'ALREADY DONE AND NOT BLOCKING THIS: the VHL Dashboard flock register shipped 16/09/2026 '
   || 'shows a row per date per SHED. Adding a Line column to it later is small - the register '
   || 'reads whole rows, so it does not need restructuring first.',
   'Flocks', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT count(*)::int AS line_task_rows
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'VHL needs line-wise%';
