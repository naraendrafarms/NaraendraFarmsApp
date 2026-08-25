-- Migration 931 (READ ONLY): the Bulk Entry screen shows each shed row TWICE
-- for Flock 19 on 2025-12-01 (one with real data, one all-zero). Check both
-- possible causes: (1) duplicate daily_records rows, (2) duplicate shed
-- entities (two different shed_id rows both named "Shed 1" etc for the same farm).
SELECT 'f19_dupe_daily_records_1201' AS chk,
       string_agg((s.shed_no || ' n=' || cnt), ' | ' ORDER BY s.shed_no) AS rows
  FROM (
    SELECT d.shed_id, count(*) AS cnt
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
     WHERE fl.flock_no::text='19' AND d.record_date='2025-12-01'
     GROUP BY d.shed_id
  ) t
  JOIN public.sheds s ON s.id = t.shed_id;

SELECT 'f19_dupe_shed_entities' AS chk,
       string_agg((fm.name || ' shed_no=' || s.shed_no || ' id=' || s.id::text || ' active=' || s.is_active), ' | ') AS rows
  FROM public.sheds s
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fm.name ILIKE '%Agraharam%' AND s.shed_no IN ('1','2','3','4');
