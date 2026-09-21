-- Clean up the per-advance rows when the bill they belong to is deleted.
-- A DELETE trigger rather than an FK CASCADE, per the repo rule.

CREATE OR REPLACE FUNCTION public.fn_del_pending_payment_advances()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.pending_payment_advances WHERE payment_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_del_pending_payment_advances ON public.pending_payments;

CREATE TRIGGER trg_del_pending_payment_advances
  BEFORE DELETE ON public.pending_payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_del_pending_payment_advances();

SELECT (SELECT count(*)::int FROM pg_trigger
        WHERE tgname = 'trg_del_pending_payment_advances' AND NOT tgisinternal) AS trigger_exists,
       (SELECT count(*)::int FROM pg_proc
        WHERE proname = 'fn_del_pending_payment_advances') AS function_exists,
       (SELECT count(*)::int FROM public.pending_payment_advances) AS link_rows,
       (SELECT count(*)::int FROM public.pending_payments) AS bills_untouched;
