-- Migration 1126: read-only, replacing 1125 which failed.
--
-- 1125 concatenated pg_trigger.tgenabled straight into a string. That column is
-- type "char", not text, so the expression errored -- and the workflow still
-- reported "Migration applied successfully" while the check never ran. The
-- cast is explicit here.
--
-- What this confirms: both chain triggers disabled by migration 1123 are back
-- on. If either were still disabled, every later Bulk Daily Entry save would
-- skip the opening/closing chain without any error being shown.

SELECT string_agg(
         tgname || '=' ||
         CASE tgenabled::text
           WHEN 'O' THEN 'enabled'
           WHEN 'D' THEN 'DISABLED'
           WHEN 'R' THEN 'replica-only'
           WHEN 'A' THEN 'always'
           ELSE 'unknown:' || tgenabled::text
         END,
         ', ' ORDER BY tgname) AS trigger_state
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;

-- Belt and braces: count anything not plainly enabled. Must be 0.
SELECT count(*)::int AS triggers_not_enabled
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass
  AND NOT tgisinternal
  AND tgenabled::text <> 'O';
