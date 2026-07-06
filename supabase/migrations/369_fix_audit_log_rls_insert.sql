-- Migration 369: fix audit_log RLS silently blocking every trigger-driven insert
--
-- Diagnosis (368_diag_audit_log_global.sql):
--   - audit_log has 20,556 total rows, but the MOST RECENT row across the
--     ENTIRE table (any table_name) is dated 2026-06-22 — meaning NOT ONE
--     real trigger-driven audit row has been written in 2+ weeks, despite
--     continuous daily/salary/VHL activity in that window.
--   - relrowsecurity = true on audit_log.
--   - fn_audit_log() is SECURITY DEFINER, but SECURITY DEFINER does NOT
--     bypass RLS unless the function owner role has BYPASSRLS — so every
--     INSERT the trigger attempts has been silently rejected by RLS with
--     no matching policy, and the function's own
--     `EXCEPTION WHEN OTHERS THEN NULL` swallows the error so the real
--     write (the actual data save) never fails or shows any error to the
--     user. Migration 170's own verification INSERT succeeded only
--     because it ran directly via the privileged migration-runner
--     connection, not through the trigger.
--
-- Fix: add an explicit INSERT policy so the trigger's own inserts succeed
-- regardless of which role is running the surrounding user action. The
-- content of every row is fully controlled by fn_audit_log() itself, not
-- by user input, so an unconditional INSERT policy is safe here.

DROP POLICY IF EXISTS audit_log_insert_all ON public.audit_log;
CREATE POLICY audit_log_insert_all ON public.audit_log
  FOR INSERT TO public WITH CHECK (true);

-- Verify: harmless no-op update on the VHL row already in the table —
-- re-saves the same remarks value, which still fires trg_audit's UPDATE
-- path without changing any real data.
UPDATE public.vhl_daily_entry
SET remarks = remarks
WHERE id = (SELECT id FROM public.vhl_daily_entry ORDER BY created_at DESC LIMIT 1);

SELECT table_name, action, changed_at, summary
FROM audit_log
WHERE table_name = 'vhl_daily_entry'
ORDER BY changed_at DESC LIMIT 3;
