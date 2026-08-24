-- Migration 860 (READ ONLY): real column names on daily_records (egg-related especially).
SELECT 'daily_records_cols' AS chk,
       string_agg(column_name, ', ' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='daily_records';
