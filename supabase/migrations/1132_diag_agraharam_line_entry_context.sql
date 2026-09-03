-- Migration 1132: read-only. What the line entry page has to work with at
-- Agraharam Potlapally, before any of it is built.
--
-- Nothing is written. Every statement is a SELECT.
--
-- Answering, in order:
--   1. The four sheds: their line counts, sides, boxes, and line_managed state.
--   2. Which flock is actually in those sheds right now, and its last record
--      date -- the page has to attach line rows to a flock, and guessing which
--      one would be exactly the kind of assumption that has gone wrong before.
--   3. Whether any shed supervisor user exists yet, and whether profile_sheds
--      has any assignment at all -- decides whether the page can restrict a
--      supervisor to their own sheds on day one or must show all.
--   4. The feed types the line feed entry would offer.
--   5. The mortality reasons already in use at shed level, so line mortality
--      offers the same list rather than inventing a new one.

-- [1] The four sheds.
SELECT s.shed_no, s.shed_name, s.line_managed, s.total_boxes,
       count(l.id)::int AS lines,
       string_agg(DISTINCT l.side, ',' ORDER BY l.side) AS sides,
       sum(l.boxes)::int AS line_boxes
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
LEFT JOIN public.shed_lines l ON l.shed_id = s.id
WHERE f.name = 'Agraharam Potlapally'
GROUP BY s.shed_no, s.shed_name, s.line_managed, s.total_boxes
ORDER BY s.shed_no;

-- [2] Which flock is in them, per shed, on the latest date each has.
SELECT s.shed_no,
       fl.flock_no,
       max(d.record_date) AS last_record,
       sum(d.closing_female)::int AS closing_f,
       sum(d.closing_male)::int AS closing_m
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE f.name = 'Agraharam Potlapally'
  AND d.record_date = (
    SELECT max(d2.record_date) FROM public.daily_records d2 WHERE d2.shed_id = d.shed_id
  )
GROUP BY s.shed_no, fl.flock_no
ORDER BY s.shed_no;

-- [3] Shed supervisor users, and whether per-shed assignment is populated.
SELECT (SELECT count(*)::int FROM public.profiles WHERE role = 'shed_supervisor') AS supervisor_users,
       (SELECT count(*)::int FROM public.profiles WHERE role = 'shed_supervisor' AND is_active) AS active_supervisors,
       (SELECT count(*)::int FROM public.profile_sheds) AS profile_shed_rows;

-- [4] Feed types the line feed entry would offer.
SELECT count(*)::int AS feed_types,
       string_agg(name, ', ' ORDER BY name) AS names
FROM public.feed_types;

-- [5] Is there ANY existing mortality-reason column to copy a list from?
-- daily_records has no 'reason' column in the base schema, so this asks the
-- catalog rather than assuming one exists somewhere else.
SELECT COALESCE(string_agg(table_name || '.' || column_name, ' | '
                           ORDER BY table_name, column_name), 'NO REASON COLUMN ANYWHERE') AS reason_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name ILIKE '%reason%' OR column_name ILIKE '%cause%');
