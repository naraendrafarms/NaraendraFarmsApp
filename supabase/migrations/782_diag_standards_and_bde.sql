-- Migration 782 (READ ONLY): what standards the app actually holds, and what
-- Bulk Daily Entry has actually recorded for Flocks 22 and 23. I said the
-- depletion standard was missing before checking every column, and the user is
-- right to make me look first.

SELECT 'standards' AS chk,
       (SELECT count(*) FROM public.breed_standard) AS rows_total,
       (SELECT string_agg(DISTINCT breed, ' , ') FROM public.breed_standard) AS breeds,
       (SELECT string_agg(DISTINCT season || '/' || sex || '/' || phase, ' , ')
          FROM public.breed_standard) AS combos,
       (SELECT min(week_of_age) || '..' || max(week_of_age) FROM public.breed_standard) AS week_range,
       (SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'breed_standard') AS standard_columns;

-- Any OTHER standards table in the database, whatever it is called.
SELECT 'other_std_tables' AS chk,
       (SELECT string_agg(table_name, ' , ' ORDER BY table_name)
          FROM information_schema.tables
         WHERE table_schema = 'public'
           AND (table_name ILIKE '%standard%' OR table_name ILIKE '%std%'
                OR table_name ILIKE '%norm%' OR table_name ILIKE '%target%'
                OR table_name ILIKE '%depletion%' OR table_name ILIKE '%curve%')) AS tables_found;

-- Does the standard carry a depletion or mortality figure under any name?
SELECT 'depletion_cols' AS chk,
       (SELECT string_agg(table_name || '.' || column_name, ' , ')
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND (column_name ILIKE '%deplet%' OR column_name ILIKE '%mortal%'
                OR column_name ILIKE '%liva%' OR column_name ILIKE '%surviv%')) AS columns_found;

-- What Bulk Daily Entry has actually stored for the two flocks in the sheets.
SELECT 'bde_data' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no
                 || ' rows=' || count(*)
                 || ' ' || min(d.record_date)::text || '..' || max(d.record_date)::text
                 || ' sheds=' || count(DISTINCT d.shed_id)
                 || ' mortF=' || COALESCE(sum(d.mortality_female), 0)
                 || ' mortM=' || COALESCE(sum(d.mortality_male), 0)
                 || ' feedF=' || round(COALESCE(sum(d.feed_female_kg), 0))
                 || ' feedM=' || round(COALESCE(sum(d.feed_male_kg), 0))
                 || ' eggs=' || COALESCE(sum(d.total_eggs), 0) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text IN ('22','23')
           GROUP BY f.flock_no
       ) x) AS per_flock,
       (SELECT count(*) FROM public.flock_weekly_performance) AS weekly_perf_rows,
       (SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'flock_weekly_performance') AS weekly_perf_columns;
