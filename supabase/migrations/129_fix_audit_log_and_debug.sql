-- Migration 129: Get full fn_audit_log source + fix with bulletproof outer exception handler

-- First: show full function source
SELECT pg_get_functiondef(oid) AS full_def
FROM pg_proc
WHERE proname = 'fn_audit_log';

-- Show what columns daily_feed actually has (audit log may reference wrong column)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'daily_feed'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medicine_usage'
ORDER BY ordinal_position;

-- Recreate fn_audit_log with a true outermost EXCEPTION handler
-- so it can NEVER block DELETE/INSERT/UPDATE regardless of any internal error
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS
$$
DECLARE
  v_user_id    UUID;
  v_user_email TEXT;
  v_record_id  UUID;
  v_summary    TEXT;
BEGIN
  BEGIN
    BEGIN
      v_user_id    := auth.uid();
      v_user_email := current_setting('request.jwt.claims', true)::json->>'email';
    EXCEPTION WHEN OTHERS THEN
      v_user_id    := NULL;
      v_user_email := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
      v_record_id := OLD.id;
      v_summary   := TG_TABLE_NAME || ' deleted id=' || OLD.id::text;
    ELSIF TG_OP = 'INSERT' THEN
      v_record_id := NEW.id;
      v_summary   := TG_TABLE_NAME || ' inserted id=' || NEW.id::text;
    ELSE
      v_record_id := NEW.id;
      v_summary   := TG_TABLE_NAME || ' updated id=' || NEW.id::text;
    END IF;

    INSERT INTO public.audit_log(user_id, user_email, table_name, record_id, action, summary, created_at)
    VALUES (v_user_id, v_user_email, TG_TABLE_NAME, v_record_id, TG_OP, v_summary, now())
    ON CONFLICT DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    -- Audit must never block real operations
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Absolute last resort outer guard
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

SELECT 'fn_audit_log recreated with bulletproof exception handler' AS status;
