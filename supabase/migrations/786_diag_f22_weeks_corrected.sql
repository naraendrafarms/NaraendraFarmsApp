-- Migration 786 (READ ONLY): migration 784 counted week 1 from the placement
-- DAY. The farm's report counts day 1 as the day AFTER placement -- Flock 22
-- was placed 05-May-2026 and its report dates week 1 as 12-May. That one-day
-- shift is why weeks 1 and 2 disagreed on feed while weeks 3 to 10 matched
-- exactly. Recount with the right rule and compare again.

SELECT 'weekly_fixed' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'wk' || lpad((floor((d.record_date - f.placement_date - 1) / 7) + 1)::text, 2, '0')
                 || ' d=' || count(DISTINCT d.record_date)
                 || ' mF=' || COALESCE(sum(d.mortality_female), 0)
                 || ' mM=' || COALESCE(sum(d.mortality_male), 0)
                 || ' fF=' || round(COALESCE(sum(d.feed_female_kg), 0))
                 || ' fM=' || round(COALESCE(sum(d.feed_male_kg), 0)) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '22'
             AND d.record_date > f.placement_date
           GROUP BY floor((d.record_date - f.placement_date - 1) / 7)
          HAVING floor((d.record_date - f.placement_date - 1) / 7) < 14
       ) x) AS f22_weeks_1_to_14;
