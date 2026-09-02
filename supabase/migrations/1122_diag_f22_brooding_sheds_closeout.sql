-- Migration 1122: read-only. Kethireddypally brooding sheds are 5, 6, 10, 11
-- and 12 (owner-confirmed). Flock 22 moved brooding-to-growing on 29/06/2026 --
-- the transfers are recorded and the growing sheds received the birds, but
-- Shed 5's daily record was never closed out and still stands at 10,211.
--
-- Before proposing a fix, check whether the other four brooding sheds have the
-- same uncleared close-out, so one pass covers all of them.

-- 1. Each brooding shed: last row before the 29/06 move, and what it closed at.
SELECT string_agg(x.line, ' | ' ORDER BY x.line) AS last_row_before_move
FROM (
  SELECT s.shed_no || ': ' || max(d.record_date)::text
         || ' cl=' || (array_agg(COALESCE(d.closing_female,0) ORDER BY d.record_date DESC))[1]::text AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12')
    AND d.record_date <= DATE '2026-06-30'
  GROUP BY s.shed_no
) x;

-- 2. Any rows AFTER the move in those sheds -- the stray ones to remove.
SELECT COALESCE(string_agg(y.line, ' | ' ORDER BY y.line), 'NONE AFTER 30/06') AS stray_rows_after
FROM (
  SELECT s.shed_no || ' ' || d.record_date::text
         || ' op=' || COALESCE(d.opening_female,0) || ' cl=' || COALESCE(d.closing_female,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12')
    AND d.record_date > DATE '2026-06-30'
) y;

-- 3. Total Flock 22 birds still sitting in brooding sheds on its latest date --
--    this is the overstatement in the flock's current count.
SELECT COALESCE(sum(d.closing_female),0)::int AS brooding_birds_on_last_date,
       COALESCE(max(d.record_date)::text,'-')  AS on_date
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12')
  AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2 WHERE d2.flock_id = d.flock_id);

-- 4. What the app currently reports as Flock 22's live birds.
SELECT current_female, current_male
FROM public.v_flock_summary
WHERE flock_no::text = '22';

-- 5. Is any other flock now recording in those brooding sheds?
SELECT COALESCE(string_agg(z.line, ' | ' ORDER BY z.line), 'NONE') AS other_flocks_in_brooding
FROM (
  SELECT 'F' || f.flock_no || ' shed' || s.shed_no || ' from ' || min(d.record_date)::text AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text <> '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12')
    AND d.record_date >= DATE '2026-06-29'
  GROUP BY f.flock_no, s.shed_no
) z;
