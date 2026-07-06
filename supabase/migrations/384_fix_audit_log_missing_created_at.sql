-- Migration 384: THE actual root cause, finally captured via audit_log_debug:
--   error: column "created_at" of relation "audit_log" does not exist (42703)
-- fn_audit_log()'s INSERT has referenced created_at since migration 170 (which
-- was supposed to add it), but the column is missing from the live table right
-- now — meaning 170's ALTER TABLE step never actually landed, even though its
-- own migration file looked correct. Every single trigger-fired insert since
-- has been failing on this exact error and getting silently swallowed by the
-- exception handler. This is completely unrelated to RLS/grants (369/373) —
-- all of that was correct but beside the point.

ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Verify it's really there this time
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name IN ('created_at','changed_at');

-- Prove the trigger now succeeds end-to-end: no-op update + check audit_log_debug got NO new row for it
UPDATE public.vhl_daily_entry
SET remarks = remarks
WHERE id = (SELECT id FROM public.vhl_daily_entry ORDER BY created_at DESC LIMIT 1);

SELECT table_name, action, changed_at, summary
FROM audit_log WHERE table_name = 'vhl_daily_entry'
ORDER BY changed_at DESC LIMIT 2;
