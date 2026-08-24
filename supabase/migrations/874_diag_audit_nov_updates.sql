-- Migration 874 (READ ONLY): were there any UPDATEs to daily_records mentioning
-- Nov-2025 in the last 2 hours (i.e. did anything -- trigger or user -- touch
-- the pre-existing sh1 boundary rows during/after migration 868's run)?
SELECT 'audit_updates_nov2025' AS chk,
       string_agg((changed_at::text || ' ' || action || ' by ' || COALESCE(user_email,'?') || ' :: ' || summary), ' | ' ORDER BY changed_at) AS rows
  FROM public.audit_log
 WHERE table_name = 'daily_records' AND action='UPDATE'
   AND changed_at > now() - interval '2 hours'
   AND (summary ILIKE '%Nov-2025%' OR summary ILIKE '%2025-11%');

SELECT 'audit_update_count_2h' AS chk, count(*)::int AS n
  FROM public.audit_log
 WHERE table_name='daily_records' AND action='UPDATE' AND changed_at > now() - interval '2 hours';
