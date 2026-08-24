-- Migration 814 (READ ONLY): full list of the 16 rows migration 813 found,
-- one per row so nothing is truncated by the runner's preview cap.
SELECT f.flock_no::text AS flock_no, d.record_date, COALESCE(s.shed_no,'(none)') AS shed_no,
       COALESCE(d.cull_female,0) AS cull_f, COALESCE(d.cull_male,0) AS cull_m, d.id AS dr_id
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
 WHERE (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0)
   AND NOT EXISTS (
         SELECT 1 FROM public.nhe_sales n
          WHERE n.flock_id = d.flock_id AND n.sale_date = d.record_date
            AND n.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
            AND COALESCE(n.quantity,0) > 0
            AND (n.shed_id = d.shed_id OR (n.shed_id IS NULL AND d.shed_id IS NULL))
       )
 ORDER BY f.flock_no, d.record_date
 LIMIT 8;

SELECT f.flock_no::text AS flock_no, d.record_date, COALESCE(s.shed_no,'(none)') AS shed_no,
       COALESCE(d.cull_female,0) AS cull_f, COALESCE(d.cull_male,0) AS cull_m, d.id AS dr_id
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
 WHERE (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0)
   AND NOT EXISTS (
         SELECT 1 FROM public.nhe_sales n
          WHERE n.flock_id = d.flock_id AND n.sale_date = d.record_date
            AND n.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
            AND COALESCE(n.quantity,0) > 0
            AND (n.shed_id = d.shed_id OR (n.shed_id IS NULL AND d.shed_id IS NULL))
       )
 ORDER BY f.flock_no, d.record_date
 OFFSET 8 LIMIT 8;
