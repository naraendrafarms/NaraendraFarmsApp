-- Migration 216: full column list of feed_production_ingredients (read-only)
SELECT 'cols' AS chk,
  string_agg(column_name || ':' || is_nullable, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='feed_production_ingredients';
