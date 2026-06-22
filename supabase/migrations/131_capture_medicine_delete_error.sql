-- Migration 131: Capture the exact error when deleting a medicine_usage row

DROP FUNCTION IF EXISTS public.diag_med_delete();

CREATE FUNCTION public.diag_med_delete()
RETURNS text
LANGUAGE plpgsql
AS
$$
DECLARE
  v_id  uuid;
  v_msg text;
BEGIN
  SELECT id INTO v_id FROM public.medicine_usage LIMIT 1;
  IF v_id IS NULL THEN
    RETURN 'no rows';
  END IF;
  BEGIN
    DELETE FROM public.medicine_usage WHERE id = v_id;
    -- undo: we are inside a function, so raise to roll back this statement's effect
    RAISE EXCEPTION 'OK_ROLLBACK';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      IF SQLERRM = 'OK_ROLLBACK' THEN
        RETURN 'DELETE OK at DB level (rolled back) id=' || v_id::text;
      END IF;
      RETURN 'FAILED: ' || SQLERRM || ' | SQLSTATE=' || SQLSTATE;
    WHEN OTHERS THEN
      RETURN 'FAILED: ' || SQLERRM || ' | SQLSTATE=' || SQLSTATE;
  END;
END
$$;

-- This SELECT result WILL be printed by run_sql.py as "OK rows=1"
SELECT public.diag_med_delete() AS delete_result;

-- Also list triggers again, but as a returnable result (text aggregated)
SELECT string_agg(tgname || ' [' || pg_get_triggerdef(oid, true) || ']', ' || ') AS triggers
FROM pg_trigger
WHERE tgrelid = 'public.medicine_usage'::regclass AND NOT tgisinternal;

DROP FUNCTION IF EXISTS public.diag_med_delete();
