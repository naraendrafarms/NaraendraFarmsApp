-- Migration 776 (READ ONLY): migration 775 statement 1 printed nothing, which
-- with this runner means a column name was wrong and the error was swallowed.
-- So ask the schema itself what these tables really have.

SELECT 'cols' AS chk,
       (SELECT string_agg(column_name, ',' ORDER BY column_name)
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'flocks') AS flocks_cols,
       (SELECT string_agg(column_name, ',' ORDER BY column_name)
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'daily_records'
           AND column_name IN ('flock_id','shed_id','record_date','eggs_total','feed_female_kg')) AS daily_key_cols,
       (SELECT count(*) FROM public.flocks) AS flock_count,
       (SELECT string_agg(flock_no::text, ',' ORDER BY flock_no) FROM public.flocks) AS flock_numbers;
