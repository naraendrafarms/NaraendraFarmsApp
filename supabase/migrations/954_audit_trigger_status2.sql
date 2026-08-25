-- Audit 954 (READ ONLY): chain trigger enabled state (cast "char" to text).
SELECT 'trigger_status' AS chk,
       string_agg(tgname || '=' || tgenabled::text, ' | ' ORDER BY tgname) AS rows
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;
