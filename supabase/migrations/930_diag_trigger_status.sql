-- Migration 930 (READ ONLY): is the chain trigger still disabled from earlier
-- this session? This affects ALL flocks' live daily entry, not just 19/20/22.
SELECT 'trigger_status' AS chk,
       string_agg((tgname || ':' || CASE WHEN tgenabled='D' THEN 'DISABLED' ELSE 'enabled' END), ' | ') AS rows
  FROM pg_trigger
 WHERE tgrelid = 'public.daily_records'::regclass
   AND tgname IN ('trg_chain_daily_opening','trg_chain_cascade');
