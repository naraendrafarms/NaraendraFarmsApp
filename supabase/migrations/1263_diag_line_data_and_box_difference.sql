-- READ ONLY. Two things.
--
-- (1) 1262 counted only line_placements / line_transfers / line_mortality and
--     reported "no line data anywhere". That was incomplete - LineDailyEntry
--     also writes line_production and line_feed. Count ALL FIVE, per farm and
--     per flock, so what really exists is on the record.
--
-- (2) The Bodjanampet-2 sheet's per-shed TOTAL boxes exceed sheds.total_boxes
--     by roughly the male box count, while its FEMALE count lands within 2-8.
--     Show the difference exactly, side by side, against the sheet's figures.
SELECT 1 AS warmup;

SELECT (SELECT count(*)::int FROM public.line_production) AS line_production,
       (SELECT count(*)::int FROM public.line_feed)       AS line_feed,
       (SELECT count(*)::int FROM public.line_mortality)  AS line_mortality,
       (SELECT count(*)::int FROM public.line_placements) AS line_placements,
       (SELECT count(*)::int FROM public.line_transfers)  AS line_transfers;

-- Which flocks and farms the existing line data belongs to.
SELECT fl.flock_no::text                     AS flock,
       fl.is_vhl_contract                    AS is_vhl,
       fa.name                               AS farm,
       count(DISTINCT p.record_date)::int    AS days_with_production,
       min(p.record_date)::text              AS first_day,
       max(p.record_date)::text              AS last_day,
       count(*)::int                         AS production_rows
FROM public.line_production p
JOIN public.shed_lines l ON l.id = p.line_id
JOIN public.sheds s      ON s.id = l.shed_id
JOIN public.farms fa     ON fa.id = s.farm_id
JOIN public.flocks fl    ON fl.id = p.flock_id
GROUP BY fl.flock_no, fl.is_vhl_contract, fa.name
ORDER BY fa.name, fl.flock_no;

-- The difference, stated exactly. Sheet figures are the owner's, typed in.
SELECT s.shed_no::text AS shed,
       v.sheet_female, v.sheet_male, (v.sheet_female + v.sheet_male) AS sheet_total,
       s.total_boxes,
       (v.sheet_female + v.sheet_male) - s.total_boxes AS sheet_total_minus_stored,
       v.sheet_female - s.total_boxes                  AS sheet_female_minus_stored
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
JOIN (VALUES ('1',2698,279),('2',2714,266),('3',2728,264),('4',2724,264))
     AS v(shed_no, sheet_female, sheet_male) ON v.shed_no = s.shed_no::text
WHERE f.name ILIKE '%bodjanampet%2%'
ORDER BY s.shed_no;
