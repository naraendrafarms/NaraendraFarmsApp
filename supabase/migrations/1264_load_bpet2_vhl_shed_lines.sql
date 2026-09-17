-- Migration 1264: load the Bodjanampet - 2 (VHL) line master from the owner's
-- line sheet of 17/09/2026, and correct sheds.total_boxes to match it.
--
-- WHY THIS IS NOW LOADABLE: migration 1119 recorded "Bodjanampet - 2 (VHL) --
-- owner reported a mistake in the sheet. Held at the owner's instruction even
-- though its totals do reconcile." This is the corrected sheet, given and
-- confirmed by the owner, who also confirmed Shed 1 as 2698 female boxes and
-- 279 male boxes in so many words.
--
-- THE FIGURES ARE BOXES, NOT BIRDS, at 2 birds per box - the same trap
-- migration 1130 had to undo for Agraharam. capacity_female / capacity_male are
-- left NULL deliberately: since migration 1137 capacity is DERIVED as
-- boxes * birds_per_box, so storing it again could only drift.
--
-- Males sit on lines 6 and 7 of side A and 18 and 19 of side B, four per shed,
-- and those same lines also carry a reduced female count - they are MIXED
-- lines, not male-only.
--
-- Every one of the eight printed side totals was re-added and matches:
--   Shed 1  A 1306f/143m  B 1392f/136m     Shed 2  A 1324f/134m  B 1390f/132m
--   Shed 3  A 1400f/132m  B 1328f/132m     Shed 4  A 1399f/132m  B 1325f/132m
--
-- sheds.total_boxes held 2700/2722/2726/2728 - the FEMALE count give or take
-- 2 to 8 boxes, with the male boxes never counted, because it came from the
-- older capacity workbook that did not split the sexes. It is corrected to the
-- full box count so Line Master's reconciliation can agree. The four rows are
-- copied to a backup table FIRST, in this same migration, so it reverses.
SELECT 1 AS warmup;

DO $$
DECLARE
  v_farm UUID;
BEGIN
  SELECT id INTO v_farm FROM public.farms WHERE name ILIKE '%bodjanampet%2%' LIMIT 1;
  IF v_farm IS NULL THEN
    RAISE EXCEPTION 'Bodjanampet - 2 farm not found - nothing written';
  END IF;

  CREATE TABLE IF NOT EXISTS public.sheds_boxes_backup_1264 AS
  SELECT id, shed_no, farm_id, total_boxes, line_managed, NOW() AS backed_up_at
  FROM public.sheds WHERE farm_id = v_farm;

  INSERT INTO public.shed_lines
    (shed_id, side, line_no, boxes, boxes_female, boxes_male, birds_per_box, is_provisional, remarks)
  SELECT s.id, v.side, v.line_no, v.f + v.m, v.f, v.m, 2, FALSE,
         'Bodjanampet-2 (VHL) line sheet 17/09/2026, owner confirmed; boxes, 2 birds per box'
  FROM (VALUES
  ('1','A',1,123,0),
  ('1','A',2,123,0),
  ('1','A',3,123,0),
  ('1','A',4,123,0),
  ('1','A',5,123,0),
  ('1','A',6,37,71),
  ('1','A',7,37,72),
  ('1','A',8,123,0),
  ('1','A',9,123,0),
  ('1','A',10,124,0),
  ('1','A',11,124,0),
  ('1','A',12,123,0),
  ('1','B',13,129,0),
  ('1','B',14,130,0),
  ('1','B',15,130,0),
  ('1','B',16,129,0),
  ('1','B',17,130,0),
  ('1','B',18,47,68),
  ('1','B',19,47,68),
  ('1','B',20,130,0),
  ('1','B',21,130,0),
  ('1','B',22,130,0),
  ('1','B',23,130,0),
  ('1','B',24,130,0),
  ('2','A',1,124,0),
  ('2','A',2,124,0),
  ('2','A',3,124,0),
  ('2','A',4,124,0),
  ('2','A',5,124,0),
  ('2','A',6,42,67),
  ('2','A',7,42,67),
  ('2','A',8,124,0),
  ('2','A',9,124,0),
  ('2','A',10,125,0),
  ('2','A',11,123,0),
  ('2','A',12,124,0),
  ('2','B',13,129,0),
  ('2','B',14,129,0),
  ('2','B',15,129,0),
  ('2','B',16,129,0),
  ('2','B',17,130,0),
  ('2','B',18,49,66),
  ('2','B',19,49,66),
  ('2','B',20,130,0),
  ('2','B',21,129,0),
  ('2','B',22,129,0),
  ('2','B',23,129,0),
  ('2','B',24,129,0),
  ('3','A',1,130,0),
  ('3','A',2,130,0),
  ('3','A',3,130,0),
  ('3','A',4,130,0),
  ('3','A',5,130,0),
  ('3','A',6,50,66),
  ('3','A',7,50,66),
  ('3','A',8,130,0),
  ('3','A',9,130,0),
  ('3','A',10,130,0),
  ('3','A',11,130,0),
  ('3','A',12,130,0),
  ('3','B',13,124,0),
  ('3','B',14,124,0),
  ('3','B',15,124,0),
  ('3','B',16,124,0),
  ('3','B',17,124,0),
  ('3','B',18,44,66),
  ('3','B',19,44,66),
  ('3','B',20,124,0),
  ('3','B',21,124,0),
  ('3','B',22,124,0),
  ('3','B',23,124,0),
  ('3','B',24,124,0),
  ('4','A',1,130,0),
  ('4','A',2,130,0),
  ('4','A',3,130,0),
  ('4','A',4,129,0),
  ('4','A',5,130,0),
  ('4','A',6,50,66),
  ('4','A',7,50,66),
  ('4','A',8,130,0),
  ('4','A',9,130,0),
  ('4','A',10,130,0),
  ('4','A',11,130,0),
  ('4','A',12,130,0),
  ('4','B',13,123,0),
  ('4','B',14,124,0),
  ('4','B',15,124,0),
  ('4','B',16,124,0),
  ('4','B',17,123,0),
  ('4','B',18,44,66),
  ('4','B',19,44,66),
  ('4','B',20,124,0),
  ('4','B',21,124,0),
  ('4','B',22,123,0),
  ('4','B',23,124,0),
  ('4','B',24,124,0)
  ) AS v(shed_no, side, line_no, f, m)
  JOIN public.sheds s ON s.farm_id = v_farm AND s.shed_no::text = v.shed_no
  ON CONFLICT (shed_id, side, line_no) DO NOTHING;

  UPDATE public.sheds s
  SET total_boxes = t.total_boxes, line_managed = TRUE
  FROM (VALUES ('1',2977),('2',2980),('3',2992),('4',2988)) AS t(shed_no, total_boxes)
  WHERE s.farm_id = v_farm AND s.shed_no::text = t.shed_no;
END $$;

SELECT s.shed_no::text AS shed, s.total_boxes, s.line_managed,
       count(l.id)::int                     AS lines_loaded,
       COALESCE(sum(l.boxes_female),0)::int AS boxes_female,
       COALESCE(sum(l.boxes_male),0)::int   AS boxes_male,
       COALESCE(sum(l.boxes),0)::int        AS boxes_total,
       CASE WHEN COALESCE(sum(l.boxes),0) = s.total_boxes THEN 'RECONCILES' ELSE 'MISMATCH' END AS check
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
LEFT JOIN public.shed_lines l ON l.shed_id = s.id
WHERE f.name ILIKE '%bodjanampet%2%'
GROUP BY s.shed_no, s.total_boxes, s.line_managed
ORDER BY s.shed_no;

SELECT count(*)::int                                  AS total_lines,
       COALESCE(sum(l.boxes_female),0)::int           AS boxes_female,
       COALESCE(sum(l.boxes_male),0)::int             AS boxes_male,
       COALESCE(sum(l.boxes),0)::int                  AS boxes_total,
       COALESCE(sum(l.boxes * l.birds_per_box),0)::int AS bird_capacity,
       count(*) FILTER (WHERE l.boxes_male > 0)::int  AS mixed_lines
FROM public.shed_lines l
JOIN public.sheds s ON s.id = l.shed_id
JOIN public.farms f ON f.id = s.farm_id
WHERE f.name ILIKE '%bodjanampet%2%';

SELECT count(*)::int AS rows_backed_up,
       string_agg(shed_no::text || '=' || COALESCE(total_boxes::text,'null'), ', ' ORDER BY shed_no) AS previous_total_boxes
FROM public.sheds_boxes_backup_1264;
