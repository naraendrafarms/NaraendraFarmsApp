-- Migration 1130: Agraharam's line figures are BOXES, not bird capacity.
--
-- Migration 1119 read the Agraharam Potlapally sheet's Female/Male columns as
-- capacity in birds and wrote them to capacity_female / capacity_male. They are
-- box counts. The magnitude gives it away: ~97-101 per line, and whole-shed
-- totals of 6,178 / 6,144 / 6,216 / 6,216 -- impossible as bird capacity for a
-- layer shed, and exactly the same order as Kethireddypally's 40/54/58/70 boxes
-- per line. Owner confirmed: boxes.
--
-- The sheet splits its boxes by sex, which the single `boxes` column cannot
-- hold, so this adds boxes_female / boxes_male. `boxes` stays the shed-level
-- comparable total (it is what Line Master reconciles against sheds.total_boxes)
-- and becomes the sum of the two where a split exists.
--
-- Kethireddypally's 292 rows are NOT touched: they were loaded into `boxes`
-- correctly and their sheet prints no F/M split, so their split columns stay
-- NULL and their boxes value stays exactly as loaded.
--
-- capacity_female / capacity_male are kept on the table -- they are still the
-- right place for real bird capacity if a sheet ever gives it -- but every
-- Agraharam row's capacity is cleared, because no sheet has told us what it is.
--
-- Additive: no shed is line_managed, and only Line Master reads shed_lines.

ALTER TABLE public.shed_lines ADD COLUMN IF NOT EXISTS boxes_female INTEGER;

ALTER TABLE public.shed_lines ADD COLUMN IF NOT EXISTS boxes_male INTEGER;

-- Move the Agraharam values across. Scoped by farm name AND by the remarks
-- stamp migration 1119 wrote, so a hand-entered row can never be caught by it.
UPDATE public.shed_lines l
SET boxes_female = l.capacity_female,
    boxes_male   = l.capacity_male,
    boxes        = COALESCE(l.capacity_female, 0) + COALESCE(l.capacity_male, 0),
    capacity_female = NULL,
    capacity_male   = NULL,
    remarks = 'Agraharam Potlapally line sheet (boxes, F/M split)'
FROM public.sheds s, public.farms f
WHERE s.id = l.shed_id
  AND f.id = s.farm_id
  AND f.name = 'Agraharam Potlapally'
  AND l.remarks = 'Agraharam Potlapally line sheet (capacity birds)';

-- VERIFY 1: Agraharam. Expect rows=192, sum_mismatches=0, capacity_left=0,
-- and the four shed totals 6178 / 6144 / 6216 / 6216 now sitting in boxes.
SELECT count(*)::int AS agraharam_rows,
       count(*) FILTER (WHERE l.boxes IS DISTINCT FROM COALESCE(l.boxes_female,0) + COALESCE(l.boxes_male,0))::int AS sum_mismatches,
       count(*) FILTER (WHERE l.capacity_female IS NOT NULL OR l.capacity_male IS NOT NULL)::int AS capacity_left,
       sum(l.boxes)::int AS total_boxes,
       sum(l.boxes_female)::int AS total_f,
       sum(l.boxes_male)::int AS total_m
FROM public.shed_lines l
JOIN public.sheds s ON s.id = l.shed_id
JOIN public.farms f ON f.id = s.farm_id
WHERE f.name = 'Agraharam Potlapally';

-- VERIFY 2: Kethireddypally must be untouched -- 292 rows, 24,044 boxes still,
-- and no F/M split invented for it.
SELECT count(*)::int AS kpally_rows,
       sum(l.boxes)::int AS kpally_boxes,
       count(*) FILTER (WHERE l.boxes_female IS NOT NULL OR l.boxes_male IS NOT NULL)::int AS split_written,
       (SELECT count(*)::int FROM public.shed_lines) AS all_rows
FROM public.shed_lines l
JOIN public.sheds s ON s.id = l.shed_id
JOIN public.farms f ON f.id = s.farm_id
WHERE f.name = 'Kethireddypally';
