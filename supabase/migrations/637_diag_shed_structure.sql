-- Diagnostic only. Before designing line-level entry, establish what shed
-- structure the app ALREADY holds — the user believes some of it is entered.
--
-- The sheds table already carries capacity and a physical breakdown:
--   a_side_boxes, b_side_boxes, total_boxes, birds_per_box,
--   capacity_female, capacity_male
-- so "capacity" does not need inventing. What does NOT exist anywhere is a
-- LINE: a grep of the whole repo finds line_no/line_id only in Purchase Intent
-- (PO line items), never in sheds. The question is whether the A-side/B-side
-- box structure already encodes the 16 physical lines, or whether lines are a
-- genuinely new level below the shed.

-- 1. How many sheds, and how much of the structure is actually filled in.
SELECT COUNT(*) AS sheds_total,
       COUNT(*) FILTER (WHERE is_active) AS active,
       COUNT(capacity_female) AS have_capacity_f,
       COUNT(capacity_male) AS have_capacity_m,
       COUNT(a_side_boxes) AS have_a_side,
       COUNT(b_side_boxes) AS have_b_side,
       COUNT(total_boxes) AS have_total_boxes,
       COUNT(birds_per_box) AS have_birds_per_box
FROM public.sheds;

-- 2. The sheds themselves, by site — so the real structure is visible rather
--    than described.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NONE') AS shed_list
FROM (
  SELECT f.name || ' / ' || s.shed_no
         || COALESCE(' (' || s.shed_name || ')', '')
         || ' type=' || COALESCE(s.shed_type,'?')
         || ' sex=' || COALESCE(s.sex,'?')
         || ' cap ♀' || COALESCE(s.capacity_female,0) || ' ♂' || COALESCE(s.capacity_male,0)
         || ' boxes A' || COALESCE(s.a_side_boxes,0) || '/B' || COALESCE(s.b_side_boxes,0)
         || '=' || COALESCE(s.total_boxes,0)
         || ' @' || COALESCE(s.birds_per_box,0) || '/box' AS line
  FROM public.sheds s LEFT JOIN public.farms f ON f.id = s.farm_id
  WHERE s.is_active
) x;

-- 3. Which sheds the three active flocks are actually using, and how many —
--    this is the population the new entry screens have to cover.
SELECT COALESCE(string_agg(fl.flock_no || ': ' || cnt || ' shed(s)', ' | ' ORDER BY fl.flock_no), 'NONE') AS sheds_per_active_flock
FROM (
  SELECT flock_id, COUNT(DISTINCT shed_id) AS cnt
  FROM public.daily_records WHERE shed_id IS NOT NULL GROUP BY flock_id
) c JOIN public.flocks fl ON fl.id = c.flock_id
WHERE fl.status <> 'closed';

-- 4. Does anything anywhere already hold a "line"? Check every column name in
--    the database rather than trusting a grep of the app code.
SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name), 'NO LINE COLUMN ANYWHERE') AS line_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name ILIKE '%line%' OR column_name ILIKE '%row_no%');

-- 5. Total capacity against birds actually standing, per active flock — the
--    occupancy figure the line-level view is ultimately meant to improve.
SELECT COALESCE(string_agg(fl.flock_no || ': capacity ♀' || cap_f || ' ♂' || cap_m
         || ' vs standing ♀' || COALESCE(v.current_female,0) || ' ♂' || COALESCE(v.current_male,0),
         ' | ' ORDER BY fl.flock_no), 'NONE') AS capacity_vs_standing
FROM (
  SELECT d.flock_id, SUM(DISTINCT COALESCE(s.capacity_female,0)) AS cap_f,
         SUM(DISTINCT COALESCE(s.capacity_male,0)) AS cap_m
  FROM public.daily_records d JOIN public.sheds s ON s.id = d.shed_id
  GROUP BY d.flock_id
) c
JOIN public.flocks fl ON fl.id = c.flock_id
LEFT JOIN public.v_flock_summary v ON v.id = fl.id
WHERE fl.status <> 'closed';
