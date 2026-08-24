-- Migration 876: disable the chain-cascade triggers on daily_records so no
-- further cross-flock contamination happens while we fix Flock 19/20/22.
-- These triggers chain opening_female/male off the previous row's closing by
-- (shed_id, record_date) ONLY -- with no regard to flock_id -- which is the
-- root cause of the cross-flock corruption found this session.
ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_daily_opening;
ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_cascade;

SELECT 'triggers_disabled' AS chk,
       string_agg((tgname || ':' || CASE WHEN tgenabled='D' THEN 'disabled' ELSE 'ENABLED' END), ' | ') AS rows
  FROM pg_trigger
 WHERE tgrelid = 'public.daily_records'::regclass
   AND tgname IN ('trg_chain_daily_opening','trg_chain_cascade');
