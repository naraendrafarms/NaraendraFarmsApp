-- Storage diagnostic: outputs sizes as a readable message in the job log
DO $$
DECLARE
  v_total   TEXT;
  v_top     TEXT := '';
  r         RECORD;
BEGIN
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_total;
  FOR r IN
    SELECT tablename,
      pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS sz,
      n_live_tup AS rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size('public.'||tablename) DESC
    LIMIT 10
  LOOP
    v_top := v_top || r.tablename || '=' || r.sz || '(' || r.rows || ' rows) | ';
  END LOOP;
  RAISE EXCEPTION 'STORAGE_REPORT total=% TABLES: %', v_total, v_top;
END;
$$;
