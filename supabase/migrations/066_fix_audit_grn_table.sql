-- Migration 066: Fix audit trigger - table is 'grn' not 'grn_entries'
-- Migration 064 incorrectly used 'grn_entries'; the actual table is 'grn'

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
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
  ELSIF TG_TABLE_NAME = 'flock_transfers' THEN
    v_summary := v_summary || ' flock transfer on ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.transfer_date, OLD.transfer_date), 'DD-Mon-YYYY'), '?');
  ELSIF TG_TABLE_NAME = 'nhe_sales' THEN
    v_summary := v_summary || ' bird/egg sale on ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.sale_date, OLD.sale_date), 'DD-Mon-YYYY'), '?') ||
      ' (' || COALESCE(NEW.sale_type, OLD.sale_type, '') || ')';
  ELSIF TG_TABLE_NAME = 'salary_monthly' THEN
    v_summary := v_summary || ' salary record for ' ||
      COALESCE(NEW.month::TEXT, OLD.month::TEXT, '?');
  ELSIF TG_TABLE_NAME = 'attendance_daily' THEN
    v_summary := v_summary || ' attendance for ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.attendance_date, OLD.attendance_date), 'DD-Mon-YYYY'), '?');
  ELSIF TG_TABLE_NAME = 'grn' THEN
    v_summary := v_summary || ' GRN ' ||
      COALESCE(NEW.grn_no, OLD.grn_no, '?');
  ELSIF TG_TABLE_NAME = 'electricity_bills' THEN
    v_summary := v_summary || ' electricity bill ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.bill_month, OLD.bill_month), 'Mon-YYYY'), '?');
  ELSIF TG_TABLE_NAME = 'flocks' THEN
    v_summary := v_summary || ' flock ' ||
      COALESCE(NEW.flock_no::TEXT, OLD.flock_no::TEXT, '?');
  ELSIF TG_TABLE_NAME = 'employees' THEN
    v_summary := v_summary || ' employee ' ||
      COALESCE(NEW.name, OLD.name, '?');
  ELSIF TG_TABLE_NAME = 'purchase_orders' THEN
    v_summary := v_summary || ' PO ' ||
      COALESCE(NEW.po_no::TEXT, OLD.po_no::TEXT, '?');
  ELSIF TG_TABLE_NAME = 'pending_payments' THEN
    v_summary := v_summary || ' payment record';
  ELSIF TG_TABLE_NAME = 'cash_book' THEN
    v_summary := v_summary || ' cash entry on ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.entry_date, OLD.entry_date), 'DD-Mon-YYYY'), '?');
  ELSIF TG_TABLE_NAME = 'farm_expenses' THEN
    v_summary := v_summary || ' farm expense on ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.expense_date, OLD.expense_date), 'DD-Mon-YYYY'), '?');
  ELSIF TG_TABLE_NAME = 'vaccination_records' THEN
    v_summary := v_summary || ' vaccination record';
  ELSIF TG_TABLE_NAME = 'daily_feed' THEN
    v_summary := v_summary || ' feed record on ' ||
      COALESCE(TO_CHAR(COALESCE(NEW.feed_date, OLD.feed_date), 'DD-Mon-YYYY'), '?');
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, user_id, user_email, changed_at, summary)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_user_id, v_user_email, now(), v_summary);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Re-attach all triggers with correct table names
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'daily_records','flock_transfers','nhe_sales','salary_monthly',
    'attendance_daily','grn','electricity_bills','flocks','employees',
    'purchase_orders','pending_payments','cash_book','farm_expenses',
    'vaccination_records','daily_feed'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()',
        t
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not attach audit trigger to %: %', t, SQLERRM;
    END;
  END LOOP;
END;
$$;
