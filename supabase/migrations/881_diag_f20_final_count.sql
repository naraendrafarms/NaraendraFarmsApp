-- Migration 881 (READ ONLY): confirm the full 2391-row import is now correctly
-- and completely in place, and re-confirm 0 formula mismatches for Flock 20.
SELECT 'f20_final_count' AS chk, count(*)::int AS n, sum(total_eggs)::bigint AS eggs_sum
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24';

SELECT 'f20_formula_check_final' AS chk, count(*)::int AS mismatches
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text = '20'
   AND (d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0)+COALESCE(d.transfer_in_female,0)+COALESCE(d.received_female,0)
          -COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))
     OR d.closing_male <> GREATEST(0, COALESCE(d.opening_male,0)+COALESCE(d.transfer_in_male,0)+COALESCE(d.received_male,0)
          -COALESCE(d.mortality_male,0)-COALESCE(d.cull_male,0)-COALESCE(d.trcull_male,0)-COALESCE(d.transfer_male,0)));
