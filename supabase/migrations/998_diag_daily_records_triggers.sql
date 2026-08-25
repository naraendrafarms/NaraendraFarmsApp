SELECT string_agg(tgname || ':' || (CASE WHEN tgenabled='O' THEN 'enabled' ELSE 'disabled' END), ', ' ORDER BY tgname) AS rows
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;
