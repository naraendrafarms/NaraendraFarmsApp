-- Migration 085: DB-level trigger to delete linked cash_book rows when an
-- nhe_sale or he_dispatch is deleted. Replaces the FK CASCADE from migration
-- 083, which silently failed to create (run_sql.py swallows "does not exist"
-- errors and the two ADD CONSTRAINTs were one atomic statement).
--
-- A trigger is more robust through this migration runner because the function
-- body is a single $$-quoted block. It guarantees cash_book stays in sync no
-- matter how the delete is initiated (UI bulk delete, import, manual SQL).

CREATE OR REPLACE FUNCTION public.fn_delete_linked_cash_book()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'nhe_sales' THEN
    DELETE FROM public.cash_book WHERE nhe_sale_id = OLD.id;
  ELSIF TG_TABLE_NAME = 'he_dispatch' THEN
    DELETE FROM public.cash_book WHERE he_dispatch_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_del_cash_book ON public.nhe_sales;
CREATE TRIGGER trg_del_cash_book
  AFTER DELETE ON public.nhe_sales
  FOR EACH ROW EXECUTE FUNCTION public.fn_delete_linked_cash_book();

DROP TRIGGER IF EXISTS trg_del_cash_book ON public.he_dispatch;
CREATE TRIGGER trg_del_cash_book
  AFTER DELETE ON public.he_dispatch
  FOR EACH ROW EXECUTE FUNCTION public.fn_delete_linked_cash_book();

NOTIFY pgrst, 'reload schema';
