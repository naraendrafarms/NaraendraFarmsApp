-- Migration 934 (READ ONLY): exact current definition of fn_chain_cascade
-- (the AFTER trigger), since fn_chain_daily_opening (BEFORE trigger) turned
-- out to already be flock-scoped correctly.
SELECT 'fn_chain_cascade_def' AS chk, pg_get_functiondef('public.fn_chain_cascade'::regproc) AS def;
