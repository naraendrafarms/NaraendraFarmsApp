SELECT 'shed_source_tables' AS chk,
  string_agg(table_name || '.' || column_name, ' | ') AS rows
FROM information_schema.columns
WHERE table_schema='public'
  AND ((table_name='flock_sheds' AND column_name IN ('flock_id','shed_id'))
    OR (table_name='shed_allocations' AND column_name IN ('flock_id','shed_id'))
    OR (table_name='flock_transfers' AND column_name IN ('flock_id','to_shed_id')));
