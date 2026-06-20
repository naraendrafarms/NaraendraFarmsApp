-- Migration 086: DIAGNOSTIC ONLY — confirm trg_del_cash_book triggers exist.
-- Reads as "OK rows=N" in job log. rows=2 means both triggers present.
SELECT 1 FROM information_schema.triggers
WHERE trigger_name = 'trg_del_cash_book'
  AND event_object_table IN ('nhe_sales', 'he_dispatch');
