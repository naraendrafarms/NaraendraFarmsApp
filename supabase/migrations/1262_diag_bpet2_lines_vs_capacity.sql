-- READ ONLY. The owner's line sheet for Bodjanampet-2 gives BOXES per line,
-- 2 birds per box. Before any of it is loaded, check it against what the app
-- already holds: sheds.total_boxes for those four sheds (Line Master
-- reconciles lines against that), and whether any shed_lines rows exist for
-- this farm already.
SELECT 1 AS warmup;

SELECT f.name                                   AS farm,
       s.shed_no::text                          AS shed,
       s.total_boxes,
       s.line_managed,
       (SELECT count(*)::int FROM public.shed_lines l WHERE l.shed_id = s.id)               AS lines_loaded,
       (SELECT COALESCE(sum(l.boxes),0)::int    FROM public.shed_lines l WHERE l.shed_id = s.id) AS boxes_loaded
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
WHERE f.name ILIKE '%bodjanampet%2%'
ORDER BY s.shed_no;

-- Which farms already have lines, so the pattern is clear.
SELECT f.name AS farm,
       count(l.id)::int                       AS line_rows,
       COALESCE(sum(l.boxes),0)::int          AS total_boxes,
       COALESCE(sum(l.boxes_female),0)::int   AS boxes_female,
       COALESCE(sum(l.boxes_male),0)::int     AS boxes_male,
       count(*) FILTER (WHERE l.birds_per_box <> 2)::int AS lines_not_2_per_box
FROM public.shed_lines l
JOIN public.sheds s ON s.id = l.shed_id
JOIN public.farms f ON f.id = s.farm_id
GROUP BY f.name
ORDER BY f.name;

SELECT (SELECT count(*)::int FROM public.line_placements) AS line_placements,
       (SELECT count(*)::int FROM public.line_transfers)  AS line_transfers,
       (SELECT count(*)::int FROM public.line_mortality)  AS line_mortality,
       (SELECT count(*)::int FROM public.sheds WHERE line_managed) AS sheds_line_managed;
