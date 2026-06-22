-- Migration 130: Find why DELETE on medicine_usage fails (feed delete now works)

-- 1. List ALL triggers on medicine_usage with their full definition
SELECT tgname AS trigger_name,
       pg_get_triggerdef(oid, true) AS def
FROM pg_trigger
WHERE tgrelid = 'public.medicine_usage'::regclass
  AND NOT tgisinternal;

-- 2. List FK constraints where medicine_usage is the PARENT (children blocking delete)
SELECT conname,
       conrelid::regclass AS child_table,
       confdeltype AS on_delete
FROM pg_constraint
WHERE confrelid = 'public.medicine_usage'::regclass
  AND contype = 'f';

-- 3. List FK constraints ON medicine_usage pointing to other tables
SELECT conname,
       confrelid::regclass AS parent_table,
       confdeltype AS on_delete
FROM pg_constraint
WHERE conrelid = 'public.medicine_usage'::regclass
  AND contype = 'f';

-- 4. Actually attempt a delete of one row inside a savepoint and report the error
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.medicine_usage LIMIT 1;
  IF v_id IS NULL THEN
    RAISE NOTICE 'No medicine_usage rows to test';
    RETURN;
  END IF;
  BEGIN
    DELETE FROM public.medicine_usage WHERE id = v_id;
    RAISE NOTICE 'TEST DELETE OK for id=%, rolling back', v_id;
    RAISE EXCEPTION 'rollback_test';  -- force rollback so we do not actually delete
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      IF SQLERRM = 'rollback_test' THEN
        RAISE NOTICE 'Delete succeeded (rolled back) — DB delete is fine';
      ELSE
        RAISE NOTICE 'DELETE FAILED: % / SQLSTATE=%', SQLERRM, SQLSTATE;
      END IF;
    WHEN OTHERS THEN
      RAISE NOTICE 'DELETE FAILED: % / SQLSTATE=%', SQLERRM, SQLSTATE;
  END;
END
$$;
