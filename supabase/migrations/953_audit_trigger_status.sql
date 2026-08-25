-- Audit 953 (READ ONLY): chain triggers still enabled?
SELECT 'trigger_status' AS chk,
       string_agg(tgname || ':' || CASE WHEN tgenabled='D' THEN 'DISABLED' ELSE 'enabled(' || tgenabled || ')' END, ' | ' ORDER BY tgname) AS rows
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;
