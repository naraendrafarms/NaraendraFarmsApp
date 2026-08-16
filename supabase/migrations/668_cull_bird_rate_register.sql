-- Daily Cull Bird rate register: one rate per DAY, in rupees per kg.
--
-- Deliberately not modelled on the HE rate register. That one is weekly
-- (Sun-Sat) because the Association declares one rate a week; cull bird rates
-- move day to day, so the key here is the date itself.
--
-- rate_date is UNIQUE so a second entry for the same day cannot quietly sit
-- beside the first and leave two different answers to "what was the rate that
-- day" -- the same trap the HE register guards against per week.

CREATE TABLE IF NOT EXISTS public.cull_bird_rate (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date  date NOT NULL UNIQUE,
  rate_per_kg numeric NOT NULL,
  remarks    text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cull_bird_rate_date ON public.cull_bird_rate (rate_date DESC);

-- VERIFY 2: the table exists with the columns the page expects.
SELECT COALESCE(string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS cull_bird_rate_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cull_bird_rate';

-- VERIFY 3: empty to start with, and the unique constraint is in place.
SELECT (SELECT COUNT(*) FROM public.cull_bird_rate)::text AS rows_now,
       (SELECT COUNT(*)::text FROM pg_indexes
        WHERE schemaname='public' AND tablename='cull_bird_rate') AS indexes_on_table;
