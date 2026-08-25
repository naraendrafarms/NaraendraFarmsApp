-- Migration 933 (READ ONLY): exact current definitions of the two chain
-- trigger functions, before modifying them to scope by flock_id.
SELECT 'fn_chain_daily_opening_def' AS chk, pg_get_functiondef('public.fn_chain_daily_opening'::regproc) AS def;
