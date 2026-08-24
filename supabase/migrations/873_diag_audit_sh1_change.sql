-- Migration 873 (READ ONLY): who/what changed Bodjanampet-1 shed1's 2025-11-09
-- and 2025-11-30 daily_records rows -- a real app user, or my import's cascade trigger?
SELECT 'audit_sh1_recent' AS chk,
       string_agg((changed_at::text || ' ' || action || ' by ' || COALESCE(user_email,'?') || ' :: ' || summary), ' | ' ORDER BY changed_at) AS rows
  FROM public.audit_log
 WHERE table_name = 'daily_records'
   AND changed_at > now() - interval '2 hours'
 LIMIT 50;
