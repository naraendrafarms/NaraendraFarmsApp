-- Audit trigger coverage gap-fill (found via full-app audit). fn_audit_log()
-- (078) is already generic and self-protecting (wraps everything in an
-- exception handler, so a trigger failure can never block a real write) —
-- these tables just never got the trigger attached. Plain repeated
-- statements, no DO block / dynamic SQL, so each attach is unambiguous.

DROP TRIGGER IF EXISTS trg_audit ON public.chat_messages;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.salary_abstract;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.salary_abstract
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.salary_allocation;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.salary_allocation
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.feed_stock_adjustments;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.feed_stock_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.stock_ledger;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.stock_ledger
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.bank_accounts;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.invoice_series;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.invoice_series
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.opening_balances;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.opening_balances
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.cms_uploads;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.cms_uploads
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.he_dispatch_lines;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.he_dispatch_lines
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.nhe_sale_lines;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.nhe_sale_lines
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit ON public.he_rate_register;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.he_rate_register
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- distinct table count (each trigger has 3 rows here, one per INSERT/UPDATE/DELETE event)
SELECT count(DISTINCT event_object_table) AS tables_with_trigger FROM information_schema.triggers
WHERE trigger_name = 'trg_audit' AND event_object_table IN (
  'chat_messages','salary_abstract','salary_allocation','feed_stock_adjustments',
  'stock_ledger','bank_accounts','invoice_series','opening_balances',
  'cms_uploads','he_dispatch_lines','nhe_sale_lines','he_rate_register'
);
