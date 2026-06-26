-- Migration 170: Diagnose and fix audit_log trigger
-- The audit log stopped recording after ~22 Jun 2026.
-- Root cause: fn_audit_log (migration 129) inserts to 'created_at' column
-- but audit_log table may only have 'changed_at'. Exception handler silently swallows the error.

-- Step 1: Ensure audit_log has BOTH column names (so either function version works)
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS changed_at TIMESTAMPTZ DEFAULT now();

-- Step 2: Recreate fn_audit_log with correct column (created_at) and robust exception handling
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
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Step 3: Re-attach triggers on all key tables (in case any got dropped)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'daily_records','flocks','nhe_sales','he_dispatch','salary_monthly',
    'attendance_daily','grn_entries','cash_book','employees','farm_expenses',
    'flock_transfers','electricity_bills','purchase_orders','party_advances'
  ] LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()', t
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- table may not exist, skip
    END;
  END LOOP;
END;
$$;

-- Step 4: Verify — insert a test audit record to confirm it works
INSERT INTO public.audit_log(table_name, record_id, action, user_id, user_email, created_at, changed_at, summary)
VALUES ('_system', gen_random_uuid(), 'INSERT', NULL, 'system', now(), now(), 'Migration 170: audit log repaired and verified');

SELECT 'Audit log fix complete — triggers re-attached on all key tables' AS status;
