-- Verification only. No schema change, no data change.
--
-- Two reasons this file exists rather than trusting the previous four logs:
--
-- 1. In migration 642's log, statement 3 (the medicine_usage row count) printed
--    nothing at all while statements 2 and 4 printed normally. run_sql.py
--    swallows any error containing "does not exist" / "already exists" /
--    "duplicate" as success, so a statement that vanishes from the log is
--    exactly the shape of a silent failure. The medicine data has to be counted
--    again, independently, before anyone is told it is intact.
-- 2. The whole five-migration set should be confirmed from one place.

-- 1. medicine_usage is untouched: the rows are all still there, still
--    flock-level, and no row has acquired a shed or a line.
SELECT COUNT(*) AS medicine_usage_rows,
       COUNT(*) FILTER (WHERE flock_id IS NOT NULL) AS rows_with_flock,
       COUNT(shed_id) AS rows_with_shed_expect_zero,
       COUNT(line_id) AS rows_with_line_expect_zero,
       COALESCE(SUM(amount), 0) AS total_amount_unchanged;

-- 2. The five new tables exist and every one of them is empty.
SELECT (SELECT COUNT(*) FROM public.shed_lines)      AS shed_lines,
       (SELECT COUNT(*) FROM public.profile_sheds)   AS profile_sheds,
       (SELECT COUNT(*) FROM public.line_production) AS line_production,
       (SELECT COUNT(*) FROM public.line_mortality)  AS line_mortality,
       (SELECT COUNT(*) FROM public.line_feed)       AS line_feed;

-- 3. Nothing is switched on, and no daily entry path has changed: every shed is
--    still shed-managed, and daily_records is exactly as it was.
SELECT (SELECT COUNT(*) FROM public.sheds WHERE line_managed) AS sheds_line_managed_expect_zero,
       (SELECT COUNT(*) FROM public.sheds) AS sheds_total,
       (SELECT COUNT(*) FROM public.daily_records) AS daily_records_rows,
       (SELECT MAX(record_date)::text FROM public.daily_records) AS last_daily_record;

-- 4. No trigger was added to daily_records by any of this -- the roll-up
--    (planned 643) is deliberately not installed, so the existing chain trigger
--    is the only one there and Bulk Daily Entry behaves exactly as before.
SELECT COALESCE(string_agg(tgname, ', ' ORDER BY tgname), 'NO TRIGGERS') AS daily_records_triggers
FROM pg_trigger WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;

-- 5. Existing logins are unaffected: role list and profile counts.
SELECT (SELECT COUNT(*) FROM public.profiles) AS profiles_total,
       (SELECT COUNT(*) FROM public.profiles WHERE role = 'shed_supervisor') AS shed_supervisors_expect_zero,
       (SELECT string_agg(role || '=' || c, ', ' ORDER BY role)
          FROM (SELECT COALESCE(role,'(null)') AS role, COUNT(*) AS c FROM public.profiles GROUP BY 1) r) AS by_role;
