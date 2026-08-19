-- Migration 780 (READ ONLY): the Chick Receipts page reads the flocks table.
-- Before saying that is the only record, check whether chick deliveries were
-- ALSO entered as GRNs. If they were, there are two sources for one delivery
-- and they need to agree, or one of them has to be the master.

SELECT 'chicks_in_grn' AS chk,
       (SELECT count(*) FROM public.grn
         WHERE item_name ILIKE '%chick%' OR item_name ILIKE '%bird%'
            OR item_name ILIKE '%breeder%' OR unit ILIKE '%nos%') AS grn_rows_that_look_like_birds,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT COALESCE(item_name, '(no name)') || ' ' || COALESCE(qty, 0) || ' ' || COALESCE(unit, '?')
                 || ' on ' || grn_date::text || ' ' || COALESCE(grn_no, '') AS t
            FROM public.grn
           WHERE item_name ILIKE '%chick%' OR item_name ILIKE '%bird%'
              OR item_name ILIKE '%breeder%'
           LIMIT 10
       ) x) AS examples,
       (SELECT string_agg(DISTINCT COALESCE(unit,'(null)'), ',') FROM public.grn) AS grn_units,
       (SELECT count(*) FROM public.grn) AS grn_rows_total;

-- What the flocks table actually holds for the split, so it is clear which
-- flocks have real billed/free figures and which have only a total.
SELECT 'flock_split' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || flock_no
                 || ' billed ' || COALESCE(paid_female,0) || 'f/' || COALESCE(paid_male,0) || 'm'
                 || ' free ' || COALESCE(free_female,0) || 'f/' || COALESCE(free_male,0) || 'm'
                 || ' placed ' || COALESCE(total_placed_f,0) || 'f/' || COALESCE(total_placed_m,0) || 'm'
                 || ' inv ' || COALESCE(chick_invoice_no, '-')
                 || ' sup ' || COALESCE(supplier, '-') AS t
            FROM public.flocks
       ) x) AS per_flock;
