-- Migration 787 (READ ONLY): compare Flock 19 and Flock 20 against their
-- weekly report workbooks BEFORE importing anything. Week 1 is the placement
-- day and the six days after -- the rule that reproduced Flock 22 exactly.
--
-- The report says, over the laying weeks it covers:
--   F19  weeks 24-67  total eggs 7,704,236  hatching eggs 7,238,063
--   F20  weeks 24-61  total eggs 6,053,437  hatching eggs 5,550,664

SELECT 'totals' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no
                 || ' placed=' || COALESCE(f.placement_date::text, '-')
                 || ' rows=' || count(*)
                 || ' days=' || count(DISTINCT d.record_date)
                 || ' eggs=' || COALESCE(sum(d.total_eggs), 0)
                 || ' he=' || COALESCE(sum(d.he_eggs), 0)
                 || ' mortF=' || COALESCE(sum(d.mortality_female), 0)
                 || ' mortM=' || COALESCE(sum(d.mortality_male), 0) AS t
            FROM public.flocks f
            LEFT JOIN public.daily_records d ON d.flock_id = f.id
           WHERE f.flock_no::text IN ('19','20')
           GROUP BY f.flock_no, f.placement_date
       ) x) AS app_totals;

-- Week by week, the same weeks the report prints, so a difference can be
-- traced to a week rather than guessed at.
SELECT 'f19_weeks' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'w' || lpad((floor((d.record_date - f.placement_date) / 7) + 1)::text, 2, '0')
                 || ' d=' || count(DISTINCT d.record_date)
                 || ' eggs=' || COALESCE(sum(d.total_eggs), 0)
                 || ' he=' || COALESCE(sum(d.he_eggs), 0) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '19' AND d.record_date >= f.placement_date
           GROUP BY floor((d.record_date - f.placement_date) / 7)
          HAVING floor((d.record_date - f.placement_date) / 7) + 1 BETWEEN 24 AND 30
       ) x) AS weeks_24_to_30;

SELECT 'f20_weeks' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'w' || lpad((floor((d.record_date - f.placement_date) / 7) + 1)::text, 2, '0')
                 || ' d=' || count(DISTINCT d.record_date)
                 || ' eggs=' || COALESCE(sum(d.total_eggs), 0)
                 || ' he=' || COALESCE(sum(d.he_eggs), 0) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '20' AND d.record_date >= f.placement_date
           GROUP BY floor((d.record_date - f.placement_date) / 7)
          HAVING floor((d.record_date - f.placement_date) / 7) + 1 BETWEEN 24 AND 30
       ) x) AS weeks_24_to_30;
