-- Migration 813 (READ ONLY): the just-fixed bug (editing a cull sale's date
-- or shed left the OLD daily_records row with a stale cull) could have been
-- creating leftovers like Flock 20's for as long as it existed, across every
-- flock -- not just the one found by chance. Find every daily_records row,
-- app-wide, that carries a nonzero cull with zero matching nhe_sales for
-- that flock+date+shed.

SELECT 'stale_cull_all_flocks' AS chk,
       count(*) AS stale_rows,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT f.flock_no::text || ' ' || d.record_date::text || ' shed=' || COALESCE(s.shed_no,'(none)')
                 || ' cull_f=' || COALESCE(d.cull_female,0) || ' cull_m=' || COALESCE(d.cull_male,0)
                 || ' dr_id=' || d.id::text AS t
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
           ORDER BY d.record_date DESC
           LIMIT 40
       ) x) AS sample
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
       );
