-- Migration 366: attach trg_audit to tables added after migration 170
-- (VHL module tables from 358, employee_advances link columns from 365) —
-- these were never included in migration 170's trigger-attach loop, so
-- writes on them produced zero audit_log rows.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'employee_advances','vhl_daily_entry','vhl_medicines',
    'vhl_medicine_usage','vhl_egg_rate_history','vhl_egg_production'
  ] LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()', t
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- table may not exist, skip
    END;
  END LOOP;
END;
$$;

-- Verify: list triggers now present on these tables
SELECT event_object_table, trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trg_audit'
  AND event_object_table IN (
    'employee_advances','vhl_daily_entry','vhl_medicines',
    'vhl_medicine_usage','vhl_egg_rate_history','vhl_egg_production'
  )
ORDER BY event_object_table;
