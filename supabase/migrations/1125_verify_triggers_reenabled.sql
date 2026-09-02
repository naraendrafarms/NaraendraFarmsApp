-- Migration 1125: read-only. run_sql.py previews only the first five
-- statements, so migration 1124's trigger check never printed. Both chain
-- triggers were disabled during 1123 and must be back on -- if either is
-- still disabled, every later Bulk Daily Entry save would skip the
-- opening/closing chain silently.

SELECT string_agg(tgname || '=' || CASE tgenabled WHEN 'O' THEN 'enabled' ELSE 'DISABLED(' || tgenabled || ')' END,
       ', ' ORDER BY tgname) AS trigger_state
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;
