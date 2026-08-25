-- Migration 915 (READ ONLY): check tasks table schema before seeding pending items.
SELECT 'tasks_cols' AS chk, string_agg(column_name, ', ' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks';
