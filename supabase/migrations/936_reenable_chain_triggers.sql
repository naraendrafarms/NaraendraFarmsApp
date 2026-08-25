-- Migration 936: re-enable the two daily_records chain triggers. Both were
-- found (migration 933/934/935) to ALREADY filter strictly by
-- flock_id = NEW.flock_id in every query -- there was no missing flock_id
-- check to add. Re-enabling a trigger does not retroactively fire it on
-- existing rows (only on future INSERT/UPDATE), so this cannot alter any
-- current live data for any flock.
ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_daily_opening;
ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_cascade;

SELECT 'triggers_reenabled' AS chk,
       string_agg((tgname || ':' || CASE WHEN tgenabled='D' THEN 'DISABLED' ELSE 'enabled' END), ' | ') AS rows
  FROM pg_trigger
 WHERE tgrelid = 'public.daily_records'::regclass
   AND tgname IN ('trg_chain_daily_opening','trg_chain_cascade');
