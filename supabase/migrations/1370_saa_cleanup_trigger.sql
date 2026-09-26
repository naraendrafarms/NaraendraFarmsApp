-- Clean up the per-advance rows when the sale they belong to is deleted.
-- DELETE triggers rather than FK CASCADE, per the repo rule, and mirroring
-- 1330 which did the same for the purchase side.
--
-- Two triggers because a buyer advance can be adjusted against either book, and
-- sale_table tells them apart - without it, deleting an HE dispatch would also
-- wipe the rows of an NHE sale that happened to share the id.

CREATE OR REPLACE FUNCTION public.fn_del_he_sale_advance_allocations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.sale_advance_allocations
   WHERE sale_id = OLD.id AND sale_table = 'he_dispatch';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.fn_del_nhe_sale_advance_allocations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.sale_advance_allocations
   WHERE sale_id = OLD.id AND sale_table = 'nhe_sales';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_del_he_sale_advance_allocations ON public.he_dispatch;

CREATE TRIGGER trg_del_he_sale_advance_allocations
  BEFORE DELETE ON public.he_dispatch
  FOR EACH ROW EXECUTE FUNCTION public.fn_del_he_sale_advance_allocations();

DROP TRIGGER IF EXISTS trg_del_nhe_sale_advance_allocations ON public.nhe_sales;

CREATE TRIGGER trg_del_nhe_sale_advance_allocations
  BEFORE DELETE ON public.nhe_sales
  FOR EACH ROW EXECUTE FUNCTION public.fn_del_nhe_sale_advance_allocations();

SELECT (SELECT count(*)::int FROM pg_trigger
        WHERE tgname IN ('trg_del_he_sale_advance_allocations','trg_del_nhe_sale_advance_allocations')
          AND NOT tgisinternal) AS triggers_exist,
       (SELECT count(*)::int FROM pg_proc
        WHERE proname IN ('fn_del_he_sale_advance_allocations','fn_del_nhe_sale_advance_allocations')) AS functions_exist,
       (SELECT count(*)::int FROM public.sale_advance_allocations) AS link_rows,
       (SELECT count(*)::int FROM public.he_dispatch) AS he_untouched,
       (SELECT count(*)::int FROM public.nhe_sales) AS nhe_untouched;
