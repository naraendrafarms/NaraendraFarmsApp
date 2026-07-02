-- Track From/To running time on the generator usage log, so hours run is
-- computed automatically instead of typed by hand. Diesel consumed (Ltr)
-- stays manual.
ALTER TABLE public.generator_usage_log
  ADD COLUMN IF NOT EXISTS from_time TIME,
  ADD COLUMN IF NOT EXISTS to_time TIME;
SELECT 'ok' AS chk;
