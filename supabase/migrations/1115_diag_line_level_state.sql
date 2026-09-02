-- Migration 1115: read-only. Current state of the line-level tables and the
-- shed capacity boxes, before answering whether shed-wise boxes can be loaded
-- now and changed later.

SELECT (SELECT count(*) FROM public.shed_lines)::int      AS shed_lines,
       (SELECT count(*) FROM public.line_production)::int AS line_production,
       (SELECT count(*) FROM public.line_mortality)::int  AS line_mortality,
       (SELECT count(*) FROM public.line_feed)::int       AS line_feed,
       (SELECT count(*) FROM public.sheds WHERE line_managed)::int AS sheds_line_managed,
       (SELECT count(*) FROM public.profiles WHERE role = 'shed_supervisor')::int AS shed_supervisors;

-- How much of the shed capacity sheet is actually filled in today?
SELECT count(*)::int             AS sheds_total,
       count(a_side_boxes)::int  AS have_a_side,
       count(b_side_boxes)::int  AS have_b_side,
       count(total_boxes)::int   AS have_total,
       COALESCE(sum(total_boxes),0)::int AS sum_total_boxes
FROM public.sheds;

-- The side rule as it stands (A/B only, or already widened to A-D?).
SELECT COALESCE(string_agg(pg_get_constraintdef(oid), ' | '), 'NO CHECK') AS side_check
FROM pg_constraint
WHERE conrelid = 'public.shed_lines'::regclass AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%side%';

-- What cascade-deletes if a line row is removed after production data exists.
SELECT string_agg(DISTINCT tc.table_name || ' -> ' || rc.delete_rule, ' | ') AS line_child_fks
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'shed_lines';

-- Shed-wise egg data already in daily_records, for the parallel-entry question.
SELECT count(*) FILTER (WHERE shed_id IS NOT NULL)::int AS shed_level_rows,
       count(*) FILTER (WHERE shed_id IS NULL)::int     AS flock_level_rows
FROM public.daily_records;
