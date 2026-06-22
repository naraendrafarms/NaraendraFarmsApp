-- Migration 128: Diagnose triggers on daily_feed and medicine_usage
-- Check what triggers exist that might block DELETE

SELECT
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_timing,
  t.action_orientation,
  pg_get_triggerdef(tr.oid, true) AS trigger_def
FROM information_schema.triggers t
JOIN pg_trigger tr ON tr.tgname = t.trigger_name
JOIN pg_class cl ON cl.oid = tr.tgrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE ns.nspname = 'public'
  AND t.event_object_table IN ('daily_feed', 'medicine_usage', 'medicine_monthly', 'daily_records')
ORDER BY t.event_object_table, t.action_timing, t.event_manipulation;

-- Also check FK constraints referencing these tables (child tables pointing to them)
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name IN ('daily_feed', 'medicine_usage', 'medicine_monthly')
ORDER BY parent_table, child_table;

-- Check audit log trigger function for daily_feed
SELECT proname, prosrc
FROM pg_proc
WHERE proname ILIKE '%audit%' OR proname ILIKE '%daily_feed%' OR proname ILIKE '%medicine%'
ORDER BY proname;
