-- Migration 375: fn_audit_log's `EXCEPTION WHEN OTHERS THEN NULL` swallows the
-- real error, which is exactly why we've been unable to diagnose this. Add a
-- one-time debug capture table and have the exception handler write the real
-- SQLERRM into it (still never blocking the real write). Once the user does
-- one live action in the app, we can read this table to see the actual cause,
-- then revert this instrumentation.

CREATE TABLE IF NOT EXISTS public.audit_log_debug (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  table_name  TEXT,
  error_msg   TEXT,
  error_state TEXT
);
ALTER TABLE public.audit_log_debug ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_debug_all ON public.audit_log_debug;
CREATE POLICY audit_log_debug_all ON public.audit_log_debug FOR ALL TO public USING (true) WITH CHECK (true);
GRANT SELECT, INSERT ON public.audit_log_debug TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    ELSE
      v_record_id := NEW.id;
    END IF;

    v_summary := CASE TG_OP
      WHEN 'DELETE' THEN 'Deleted'
      WHEN 'INSERT' THEN 'Created'
      ELSE 'Updated'
    END;

    IF TG_TABLE_NAME = 'daily_records' THEN
      v_summary := v_summary || ' daily record for ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.record_date, OLD.record_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'flocks' THEN
      v_summary := v_summary || ' flock ' || COALESCE(NEW.flock_no::TEXT, OLD.flock_no::TEXT, '?');
    ELSIF TG_TABLE_NAME = 'nhe_sales' THEN
      v_summary := v_summary || ' sale on ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.sale_date, OLD.sale_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'he_dispatch' THEN
      v_summary := v_summary || ' HE dispatch on ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.dispatch_date, OLD.dispatch_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'salary_monthly' THEN
      v_summary := v_summary || ' salary for ' || COALESCE(NEW.month::TEXT, OLD.month::TEXT, '?');
    ELSIF TG_TABLE_NAME = 'attendance_daily' THEN
      v_summary := v_summary || ' attendance for ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.attendance_date, OLD.attendance_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'grn_entries' THEN
      v_summary := v_summary || ' GRN ' || COALESCE(NEW.grn_no, OLD.grn_no, '?');
    ELSIF TG_TABLE_NAME = 'cash_book' THEN
      v_summary := v_summary || ' cash entry on ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.txn_date, OLD.txn_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'employees' THEN
      v_summary := v_summary || ' employee ' || COALESCE(NEW.name, OLD.name, '?');
    ELSIF TG_TABLE_NAME = 'farm_expenses' THEN
      v_summary := v_summary || ' expense on ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.expense_date, OLD.expense_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'party_advances' THEN
      v_summary := v_summary || ' party advance on ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.advance_date, OLD.advance_date), 'DD-Mon-YYYY'), '?');
    ELSE
      v_summary := v_summary || ' ' || TG_TABLE_NAME || ' record';
    END IF;

    INSERT INTO public.audit_log(table_name, record_id, action, user_id, user_email, created_at, changed_at, summary)
    VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_user_id, v_user_email, now(), now(), v_summary);

  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO public.audit_log_debug(table_name, error_msg, error_state)
      VALUES (TG_TABLE_NAME, SQLERRM, SQLSTATE);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- even the debug insert must never block the real write
    END;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

SELECT 'Debug capture installed — do one live save in the app, then check audit_log_debug' AS status;
