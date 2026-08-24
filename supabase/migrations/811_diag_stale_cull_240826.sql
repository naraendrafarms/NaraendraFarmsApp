-- Migration 811 (READ ONLY): find daily_records rows dated 24/08/2026 that
-- still carry a nonzero cull, but have no matching bird sale left on that
-- date+shed in nhe_sales -- exactly the leftover the just-fixed edit bug
-- would produce.

SELECT 'stale_240826' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT f.flock_no::text || ' shed=' || COALESCE(s.shed_no,'(none)')
                 || ' cull_f=' || COALESCE(d.cull_female,0) || ' cull_m=' || COALESCE(d.cull_male,0)
                 || ' dr_id=' || d.id::text
                 || ' matching_sales=' || (
                    SELECT count(*) FROM public.nhe_sales n
                     WHERE n.flock_id = d.flock_id AND n.sale_date = d.record_date
                       AND n.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
                       AND COALESCE(n.quantity,0) > 0
                       AND (n.shed_id = d.shed_id OR (n.shed_id IS NULL AND d.shed_id IS NULL))
                 ) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.sheds s ON s.id = d.shed_id
           WHERE d.record_date = '2026-08-24'
             AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0)
       ) x) AS rows;
