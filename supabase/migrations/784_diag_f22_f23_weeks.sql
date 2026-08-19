-- Migration 784 (READ ONLY): the weekly report counts DAYS FROM PLACEMENT
-- (7, 14, 21 ...), not calendar weeks, and a part week at the end is not
-- reported at all. So build the same weeks the sheet builds and compare them
-- against what Bulk Daily Entry actually holds, flock by flock.

SELECT 'placement' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no
                 || ' placed=' || COALESCE(f.placement_date::text, '-')
                 || ' status=' || COALESCE(f.status, '-')
                 || ' first_record=' || COALESCE(min(d.record_date)::text, 'none')
                 || ' last_record=' || COALESCE(max(d.record_date)::text, 'none')
                 || ' days_covered=' || count(DISTINCT d.record_date) AS t
            FROM public.flocks f
            LEFT JOIN public.daily_records d ON d.flock_id = f.id
           WHERE f.flock_no::text IN ('22','23')
           GROUP BY f.flock_no, f.placement_date, f.status
       ) x) AS flocks;

-- Week 1 = placement day .. placement + 6 days, exactly as the sheet counts.
SELECT 'weekly' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' wk' || lpad((floor((d.record_date - f.placement_date) / 7) + 1)::text, 2, '0')
                 || ' days=' || count(DISTINCT d.record_date)
                 || ' mortF=' || COALESCE(sum(d.mortality_female), 0)
                 || ' mortM=' || COALESCE(sum(d.mortality_male), 0)
                 || ' feedF=' || round(COALESCE(sum(d.feed_female_kg), 0))
                 || ' feedM=' || round(COALESCE(sum(d.feed_male_kg), 0)) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text IN ('22','23')
             AND f.placement_date IS NOT NULL
             AND d.record_date >= f.placement_date
           GROUP BY f.flock_no, floor((d.record_date - f.placement_date) / 7)
       ) x) AS by_week;

-- Anything recorded BEFORE the placement date would break the week numbering.
SELECT 'before_placement' AS chk,
       (SELECT count(*) FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text IN ('22','23') AND f.placement_date IS NOT NULL
           AND d.record_date < f.placement_date) AS rows_before_placement,
       (SELECT count(*) FROM public.std_production_curve WHERE hen_week_pct IS NOT NULL) AS curve_with_hen_week;
