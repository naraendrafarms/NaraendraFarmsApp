-- Migration 878 (READ ONLY): verify the fix restored TRUE correct values, not
-- just internally-consistent ones. Cross-check against known-good references:
-- Flock 19 shed5: 2025-02-22 close=4896, 2025-02-23 close=10244, 2025-02-24 close=10240
-- (verified earlier this session, migration 855, before this new bug).
-- Flock 20 sh1: 2025-11-09 open should be back near its original 5788-ish value.
SELECT 'f19_shed5_check' AS chk,
       string_agg((d.record_date::text || ' close_f=' || d.closing_female), ' | ' ORDER BY d.record_date) AS rows
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
 WHERE fl.flock_no::text='19' AND s.shed_no='5' AND d.record_date BETWEEN '2025-02-22' AND '2025-02-24';

SELECT 'f20_sh1_boundary' AS chk,
       string_agg((d.record_date::text || ' open_f=' || d.opening_female || ' close_f=' || d.closing_female), ' | ' ORDER BY d.record_date) AS rows
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text='20' AND fm.name='Bodjanampet - 1' AND s.shed_no='1'
   AND d.record_date IN ('2025-11-09','2025-11-30','2026-06-01');
