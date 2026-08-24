-- Migration 875 (READ ONLY): critical scope check for the cascade triggered by
-- migration 868's inserts. Two questions:
-- (1) Did the cascade touch ANY row belonging to a flock OTHER than Flock 20
--     (shared shed reuse across flocks would make this a real cross-flock bug)?
-- (2) For Flock 20 itself, is the shift a clean, consistent offset (expected
--     gap-fill reconciliation) or erratic (real corruption)?
SELECT 'cascade_other_flocks' AS chk,
       string_agg((fl.flock_no::text || ' sh_of_' || fm.name || ':' || s.shed_no || ' n=' || cnt), ' | ' ORDER BY fl.flock_no) AS rows
  FROM (
    SELECT d.flock_id, d.shed_id, count(*) AS cnt
      FROM public.daily_records d
     WHERE d.remarks IS DISTINCT FROM 'F20_IMPORT_2026-08-24'
       AND d.shed_id IN (
         SELECT DISTINCT shed_id FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24'
       )
     GROUP BY d.flock_id, d.shed_id
  ) t
  JOIN public.flocks fl ON fl.id = t.flock_id
  JOIN public.sheds s ON s.id = t.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text <> '20';

SELECT 'sh1_shift_consistency' AS chk,
       string_agg((d.record_date::text || ' open_f=' || d.opening_female || ' close_f=' || d.closing_female), ' | ' ORDER BY d.record_date) AS rows
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text='20' AND fm.name='Bodjanampet - 1' AND s.shed_no='1'
   AND d.record_date IN ('2025-11-08','2025-11-09','2025-11-30','2025-12-01','2026-05-31','2026-06-01','2026-08-24');
