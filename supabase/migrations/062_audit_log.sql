-- ── Audit Log ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  TEXT        NOT NULL,
  record_id   UUID,
  action      TEXT        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  user_id     UUID,
  user_email  TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary     TEXT
);

CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx  ON public.audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx     ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS audit_log_table_name_idx  ON public.audit_log (table_name);

-- RLS: only admins can read audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow the trigger function (SECURITY DEFINER) to insert into audit_log
DROP POLICY IF EXISTS "audit_log_insert_all" ON public.audit_log;
CREATE POLICY "audit_log_insert_all" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- ── Trigger function ───────────────────────────────────────────────────────────
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
  -- Capture user from JWT context
  BEGIN
    v_user_id    := auth.uid();
    v_user_email := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN
    v_user_id    := NULL;
    v_user_email := NULL;
  END;

  -- Get record id
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
  ELSE
    v_record_id := NEW.id;
  END IF;

  -- Human-readable summary per table
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
    v_summary := v_summary || ' NHE/bird sale on ' ||
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
      COALESCE(NEW.bill_month::TEXT, OLD.bill_month::TEXT, '?');
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
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, user_id, user_email, changed_at, summary)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_user_id, v_user_email, now(), v_summary);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── Attach triggers to key tables ─────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'daily_records','flock_transfers','nhe_sales','salary_monthly',
    'attendance_daily','grn','electricity_bills','flocks','employees',
    'purchase_orders','pending_payments','cash_book','farm_expenses',
    'vaccination_records'
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
      RAISE NOTICE ''Could not attach audit trigger to %: %'', t, SQLERRM;
    END;
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
