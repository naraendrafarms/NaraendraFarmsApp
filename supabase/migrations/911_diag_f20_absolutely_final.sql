-- Migration 911 (READ ONLY): the true, absolutely final verification.
SELECT 'f20_TRUE_final_count' AS chk, count(*)::int AS n, sum(total_eggs)::bigint AS eggs_sum
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24';

SELECT 'f20_TRUE_final_mismatches' AS chk, count(*)::int AS mismatches
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text = '20'
   AND (d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0)+COALESCE(d.transfer_in_female,0)+COALESCE(d.received_female,0)
          -COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))
     OR d.closing_male <> GREATEST(0, COALESCE(d.opening_male,0)+COALESCE(d.transfer_in_male,0)+COALESCE(d.received_male,0)
          -COALESCE(d.mortality_male,0)-COALESCE(d.cull_male,0)-COALESCE(d.trcull_male,0)-COALESCE(d.transfer_male,0)));

SELECT 'f20_TRUE_final_dupes' AS chk, count(*)::int AS n
  FROM (
    SELECT d.shed_id, d.record_date FROM public.daily_records d
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
     GROUP BY d.shed_id, d.record_date HAVING count(*) > 1
  ) x;

SELECT 'f19_f22_still_ok' AS chk,
       string_agg((fl.flock_no::text || ':mismatches=' || cnt), ' | ' ORDER BY fl.flock_no) AS rows
  FROM (
    SELECT d.flock_id, count(*) AS cnt
      FROM public.daily_records d
     WHERE d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0)+COALESCE(d.transfer_in_female,0)+COALESCE(d.received_female,0)
             -COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))
        OR d.closing_male <> GREATEST(0, COALESCE(d.opening_male,0)+COALESCE(d.transfer_in_male,0)+COALESCE(d.received_male,0)
             -COALESCE(d.mortality_male,0)-COALESCE(d.cull_male,0)-COALESCE(d.trcull_male,0)-COALESCE(d.transfer_male,0))
     GROUP BY d.flock_id
  ) t
  JOIN public.flocks fl ON fl.id = t.flock_id
 WHERE fl.flock_no::text IN ('19','22');
