-- Migration 1138: birds per box is 2 at Agraharam Potlapally, Bodjanampet-1
-- and Bodjanampet-2 -- but NOT at Kethireddypally.
--
-- Migration 1137 added birds_per_box as NOT NULL DEFAULT 2, which quietly put 2
-- on all 484 lines including Kethireddypally's 292. That made Kethireddypally
-- read as 24,044 boxes * 2 = 48,088 birds of capacity, a figure nobody has
-- given us. A wrong number shown confidently is worse than no number.
--
-- So: the column becomes nullable, Kethireddypally's lines are set to NULL
-- (unknown, and the screens show a dash rather than a capacity), and Agraharam
-- keeps 2. The DEFAULT stays 2 because three of the four sites are 2, and
-- Bodjanampet-1 and -2 have no lines loaded yet -- when their sheets are loaded
-- they will get the right value without anyone remembering to set it.
--
-- Nothing outside shed_lines is touched. daily_records and every existing
-- screen are untouched, as instructed -- the line side runs in parallel.

ALTER TABLE public.shed_lines ALTER COLUMN birds_per_box DROP NOT NULL;

UPDATE public.shed_lines l
SET birds_per_box = NULL
FROM public.sheds s, public.farms f
WHERE s.id = l.shed_id AND f.id = s.farm_id
  AND f.name = 'Kethireddypally';

-- VERIFY 1: Agraharam still 2 on all 192 lines and 49,508 birds of capacity;
-- Kethireddypally now unknown on all 292 and contributes no capacity.
SELECT f.name AS farm,
       count(*)::int AS lines,
       count(l.birds_per_box)::int AS with_birds_per_box,
       COALESCE(string_agg(DISTINCT l.birds_per_box::text, ','), 'NULL (unknown)') AS values_held,
       COALESCE(sum(l.boxes * l.birds_per_box)::int, 0) AS capacity_birds,
       sum(l.boxes)::int AS boxes
FROM public.shed_lines l
JOIN public.sheds s ON s.id = l.shed_id
JOIN public.farms f ON f.id = s.farm_id
GROUP BY f.name ORDER BY f.name;

-- VERIFY 2: the default for a NEW line is still 2, and nothing else moved.
SELECT (SELECT column_default FROM information_schema.columns
        WHERE table_schema='public' AND table_name='shed_lines' AND column_name='birds_per_box') AS default_for_new_lines,
       (SELECT is_nullable FROM information_schema.columns
        WHERE table_schema='public' AND table_name='shed_lines' AND column_name='birds_per_box') AS nullable,
       (SELECT count(*)::int FROM public.shed_lines) AS shed_lines_rows,
       (SELECT count(*)::int FROM public.daily_records) AS daily_records_untouched,
       (SELECT count(*)::int FROM public.line_placements) AS placements,
       (SELECT count(*)::int FROM public.line_transfers) AS transfers;
