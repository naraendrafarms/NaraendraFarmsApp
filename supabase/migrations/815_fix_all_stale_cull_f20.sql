-- Migration 815: repair every Flock 20 daily_records row that carries a
-- stale cull with zero matching nhe_sales (the pre-fix leftover pattern
-- found by 813/814 -- same class as the 24/08/2026 row already repaired,
-- just from before today's fix). Flock 19's single flagged row is a real,
-- directly-entered cull confirmed earlier and is deliberately excluded.
-- Recomputes trcull/closing the same way the app's own syncShedCull() does,
-- rather than just blanking the numbers.

WITH stale AS (
  SELECT d.id
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
   WHERE f.flock_no::text = '20'
     AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0)
     AND NOT EXISTS (
           SELECT 1 FROM public.nhe_sales n
            WHERE n.flock_id = d.flock_id AND n.sale_date = d.record_date
              AND n.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
              AND COALESCE(n.quantity,0) > 0
              AND (n.shed_id = d.shed_id OR (n.shed_id IS NULL AND d.shed_id IS NULL))
         )
)
UPDATE public.daily_records d
   SET cull_female = 0,
       trcull_female = COALESCE(d.transfer_female, 0),
       trcull_male   = COALESCE(d.transfer_male, 0),
       closing_female = GREATEST(0, COALESCE(d.opening_female,0) - COALESCE(d.transfer_female,0) - COALESCE(d.mortality_female,0)),
       closing_male   = GREATEST(0, COALESCE(d.opening_male,0)   - COALESCE(d.transfer_male,0)   - COALESCE(d.mortality_male,0))
  FROM stale s
 WHERE d.id = s.id;

-- Verify: how many Flock 20 rows still match the stale-cull condition --
-- should be 0 now.
SELECT 'remaining_stale_f20' AS chk, count(*) AS still_stale FROM (
  SELECT d.id
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
   WHERE f.flock_no::text = '20'
     AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0)
     AND NOT EXISTS (
           SELECT 1 FROM public.nhe_sales n
            WHERE n.flock_id = d.flock_id AND n.sale_date = d.record_date
              AND n.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
              AND COALESCE(n.quantity,0) > 0
              AND (n.shed_id = d.shed_id OR (n.shed_id IS NULL AND d.shed_id IS NULL))
         )
) x;
