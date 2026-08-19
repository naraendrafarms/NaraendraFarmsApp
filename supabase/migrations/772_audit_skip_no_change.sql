-- Migration 772: an update that changes nothing is not history.
--
-- Measured by migration 770: attendance_daily holds 12,028 rows and has
-- produced 12,028 audit INSERTs and 432,589 audit UPDATEs. Every row has been
-- rewritten about thirty-six times, because saving the month grid writes back
-- every cell whether or not it was touched. That single habit is 83% of the
-- audit log, which is itself 166 MB of the 207 MB database on a 500 MB plan.
--
-- From here, if the row after the update is identical to the row before it,
-- nothing is written. Real edits are logged exactly as before, values and all.
-- updated_at is ignored in the comparison, since it changes on every save by
-- definition and would defeat the whole point.
--
-- Nothing already recorded is deleted by this migration.

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
  v_old        JSONB;
  v_new        JSONB;
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
      v_old := to_jsonb(OLD);
      v_new := NULL;
    ELSIF TG_OP = 'INSERT' THEN
      v_record_id := NEW.id;
      v_old := NULL;
      v_new := to_jsonb(NEW);
    ELSE
      v_record_id := NEW.id;
      v_old := to_jsonb(OLD);
      v_new := to_jsonb(NEW);
      -- A save that altered nothing leaves no trace.
      IF (v_old - 'updated_at' - 'modified_at') = (v_new - 'updated_at' - 'modified_at') THEN
        RETURN NEW;
      END IF;
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
    ELSIF TG_TABLE_NAME = 'hatch_batches' THEN
      v_summary := v_summary || ' hatch batch set on ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.setting_date, OLD.setting_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'salary_monthly' THEN
      v_summary := v_summary || ' salary for ' || COALESCE(NEW.month::TEXT, OLD.month::TEXT, '?');
    ELSIF TG_TABLE_NAME = 'attendance_daily' THEN
      v_summary := v_summary || ' attendance for ' ||
        COALESCE(TO_CHAR(COALESCE(NEW.attendance_date, OLD.attendance_date), 'DD-Mon-YYYY'), '?');
    ELSIF TG_TABLE_NAME = 'grn' OR TG_TABLE_NAME = 'grn_entries' THEN
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

    INSERT INTO public.audit_log(table_name, record_id, action, user_id, user_email,
                                 created_at, changed_at, summary, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_user_id, v_user_email,
            now(), now(), v_summary, v_old, v_new);

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

SELECT 'skip_rule' AS chk,
       CASE WHEN prosrc LIKE '%A save that altered nothing%' THEN 'in place' ELSE 'MISSING' END AS state
FROM pg_proc WHERE proname = 'fn_audit_log';
