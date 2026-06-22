-- Show top tables by size
SELECT tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
  n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 15;
