-- Migration 795 (READ ONLY): a week's hatching eggs and the eggs that were
-- actually SET are two different quantities. The flock may lay 30,000 HE in a
-- week while 25,000 go to the hatchery, and the hatch report covers only those
-- 25,000. Hatch % is then a fact about 25,000 eggs, while Chicks per hen housed
-- silently reads as though the whole week's production had been set.
--
-- Measure the gap on Flock 19, week by week: hatching eggs PRODUCED (from the
-- daily records), eggs DISPATCHED (from the dispatch lines, by the date the
-- eggs were laid), and eggs SET (from the hatch batches behind those
-- dispatches). Weeks are one-based, as the standard numbers them.

SELECT 'he_flow' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'w' || lpad(wk::text, 2, '0')
                 || ' produced=' || COALESCE(sum(produced), 0)
                 || ' dispatched=' || COALESCE(sum(dispatched), 0)
                 || ' set=' || COALESCE(sum(eggs_set), 0) AS t
          FROM (
            -- HE produced, by the day it was laid
            SELECT floor((d.record_date - f.placement_date) / 7) + 1 AS wk,
                   sum(d.he_eggs) AS produced, 0 AS dispatched, 0 AS eggs_set
              FROM public.daily_records d
              JOIN public.flocks f ON f.id = d.flock_id
             WHERE f.flock_no::text = '19' AND d.record_date >= f.placement_date
             GROUP BY 1
            UNION ALL
            -- HE dispatched, by the PRODUCTION date on the dispatch line
            SELECT floor((l.prod_date - f.placement_date) / 7) + 1,
                   0,
                   sum(COALESCE(l.grade_a,0) + COALESCE(l.grade_b,0) + COALESCE(l.grade_c,0)),
                   0
              FROM public.he_dispatch_lines l
              JOIN public.he_dispatch dd ON dd.id = l.dispatch_id
              JOIN public.flocks f ON f.id = dd.flock_id
             WHERE f.flock_no::text = '19'
             GROUP BY 1
            UNION ALL
            -- Eggs SET, attributed to the production weeks of the dispatch
            -- they came from, in proportion to each day's eggs.
            SELECT floor((l.prod_date - f.placement_date) / 7) + 1,
                   0, 0,
                   sum(b.eggs_set
                       * (COALESCE(l.grade_a,0) + COALESCE(l.grade_b,0) + COALESCE(l.grade_c,0))::numeric
                       / NULLIF(tot.line_eggs, 0))
              FROM public.hatch_batches b
              JOIN public.he_dispatch dd ON dd.id = b.dispatch_id
              JOIN public.flocks f ON f.id = dd.flock_id
              JOIN public.he_dispatch_lines l ON l.dispatch_id = dd.id
              JOIN LATERAL (
                SELECT sum(COALESCE(l2.grade_a,0) + COALESCE(l2.grade_b,0) + COALESCE(l2.grade_c,0)) AS line_eggs
                  FROM public.he_dispatch_lines l2 WHERE l2.dispatch_id = dd.id
              ) tot ON TRUE
             WHERE f.flock_no::text = '19'
             GROUP BY 1
          ) u
          WHERE wk BETWEEN 24 AND 36
          GROUP BY wk
       ) x) AS f19_weeks_24_to_36;
