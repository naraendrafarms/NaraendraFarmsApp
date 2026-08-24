-- Migration 826 (READ ONLY): did any real bird sale get entered for Flock 19
-- between 16-02-2025 (chicks received) and 22-06-2025 (site shift complete)?
-- User claims none were sold in this window -- check nhe_sales directly.

SELECT 'f19_sales_in_window' AS chk,
       count(*)::int AS n,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT (s.sale_date::text || ' ' || s.sale_type || ' qty=' || COALESCE(s.quantity,0)
                  || ' amt=' || COALESCE(s.amount,0)
                  || ' shed=' || COALESCE(sh.shed_no,'none')) AS t
            FROM public.nhe_sales s
            JOIN public.flocks f ON f.id = s.flock_id
            LEFT JOIN public.sheds sh ON sh.id = s.shed_id
           WHERE f.flock_no::text = '19'
             AND s.sale_date BETWEEN '2025-02-16' AND '2025-06-22'
       ) x) AS rows
  FROM public.nhe_sales s
  JOIN public.flocks f ON f.id = s.flock_id
 WHERE f.flock_no::text = '19'
   AND s.sale_date BETWEEN '2025-02-16' AND '2025-06-22';

-- Also: earliest bird sale ever recorded for Flock 19, whatever the date, for context.
SELECT 'f19_earliest_sale' AS chk,
       min(s.sale_date)::text AS earliest_sale_date
  FROM public.nhe_sales s
  JOIN public.flocks f ON f.id = s.flock_id
 WHERE f.flock_no::text = '19';
