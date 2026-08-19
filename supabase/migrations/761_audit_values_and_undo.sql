-- Migration 761: the audit log keeps the VALUES, and an admin can undo.
--
-- Today an invoice link overwrote Eggs Set on two batches. The audit log could
-- say the rows were changed at 14:48 and 14:49 by admin, and nothing more: it
-- stored who and when, never what. So the original figures were gone, and the
-- repair needed the user to remember them.
--
-- From here every change carries the row as it WAS and as it BECAME. That makes
-- three things possible: reading what actually changed, restoring it with one
-- action, and — on the free plan, where point-in-time recovery is not available
-- — having any way back at all short of the nightly export.
--
-- Storage is the reason to be careful on a free plan: the values are kept for
-- 120 days and then dropped, while the who/when/what line stays for ever. A
-- mistake older than four months is a matter for the export, not for undo.

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS old_data JSONB;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS new_data JSONB;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS undone_at TIMESTAMPTZ;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS undone_by TEXT;

CREATE INDEX IF NOT EXISTS audit_log_record_idx ON public.audit_log (table_name, record_id, changed_at DESC);

-- The trigger, unchanged in what it summarises, now also stores both versions
-- of the row. Everything stays inside the exception handler: an audit failure
-- must never stop somebody saving their day's work.
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

-- ── Undo ─────────────────────────────────────────────────────────────────────
-- Put one change back the way it was. Admin only, checked here rather than only
-- on screen. Undoing is itself a change, so it is audited like any other and
-- can be undone in turn.
CREATE OR REPLACE FUNCTION public.fn_undo_audit(p_audit_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a           public.audit_log%ROWTYPE;
  v_is_admin  BOOLEAN;
  v_email     TEXT;
  v_cols      TEXT;
  v_vals      TEXT;
  v_sets      TEXT;
  v_exists    BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only an administrator can undo a change';
  END IF;

  SELECT * INTO a FROM public.audit_log WHERE id = p_audit_id;
  IF a.id IS NULL THEN RAISE EXCEPTION 'That change is not in the log'; END IF;
  IF a.undone_at IS NOT NULL THEN RAISE EXCEPTION 'That change has already been undone'; END IF;
  IF a.record_id IS NULL THEN RAISE EXCEPTION 'That entry has no record to restore'; END IF;
  IF a.old_data IS NULL AND a.new_data IS NULL THEN
    RAISE EXCEPTION 'This change was recorded before the app kept values, so there is nothing to restore';
  END IF;

  BEGIN
    v_email := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN v_email := NULL; END;

  IF a.action = 'UPDATE' THEN
    -- Write every column back to what it held.
    SELECT string_agg(format('%I = %L', key, value), ', ')
      INTO v_sets
      FROM jsonb_each_text(a.old_data)
     WHERE key <> 'id';
    EXECUTE format('UPDATE public.%I SET %s WHERE id = %L', a.table_name, v_sets, a.record_id);

  ELSIF a.action = 'DELETE' THEN
    -- Put the row back, unless something already occupies its id.
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = %L)', a.table_name, a.record_id)
      INTO v_exists;
    IF v_exists THEN RAISE EXCEPTION 'A record with that id already exists, so the deleted one cannot be put back'; END IF;
    SELECT string_agg(format('%I', key), ', '), string_agg(format('%L', value), ', ')
      INTO v_cols, v_vals
      FROM jsonb_each_text(a.old_data);
    EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s)', a.table_name, v_cols, v_vals);

  ELSIF a.action = 'INSERT' THEN
    EXECUTE format('DELETE FROM public.%I WHERE id = %L', a.table_name, a.record_id);
  END IF;

  UPDATE public.audit_log SET undone_at = now(), undone_by = COALESCE(v_email, 'admin')
   WHERE id = p_audit_id;

  RETURN 'Undone: ' || COALESCE(a.summary, a.table_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_undo_audit(UUID) TO authenticated;

-- ── Retention ────────────────────────────────────────────────────────────────
-- Free plan means a small database, so the values are dropped after 120 days
-- while the line saying who changed what and when is kept. Called nightly.
CREATE OR REPLACE FUNCTION public.fn_prune_audit_values()
RETURNS INTEGER
LANGUAGE plpgsql AS
$$
DECLARE v_n INTEGER;
BEGIN
  UPDATE public.audit_log
     SET old_data = NULL, new_data = NULL
   WHERE changed_at < now() - INTERVAL '120 days'
     AND (old_data IS NOT NULL OR new_data IS NOT NULL);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

SELECT 'columns' AS chk, count(*)::int AS n
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'audit_log'
  AND column_name IN ('old_data','new_data','undone_at','undone_by');

SELECT 'functions' AS chk,
       count(*) FILTER (WHERE proname = 'fn_undo_audit')::int AS undo,
       count(*) FILTER (WHERE proname = 'fn_prune_audit_values')::int AS prune
FROM pg_proc WHERE proname IN ('fn_undo_audit','fn_prune_audit_values');

NOTIFY pgrst, 'reload schema';
