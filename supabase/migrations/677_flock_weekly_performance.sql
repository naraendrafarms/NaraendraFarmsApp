-- Flock weekly actuals, to be compared against the Vencobb430 standards.
--
-- Body weight is the gap this fills: nothing in the app records it today, which
-- is why the Monthly Production Review still lists body weight, gain,
-- uniformity and CV as deliberately absent. Feed is NOT duplicated here -- the
-- app already records it daily in daily_feed, and a second copy would give two
-- answers to one question.
--
-- Keyed by flock + week of age + sex. Sex matters because males and females are
-- weighed apart and have different standards (Tables 3 and 4 for males).
-- week_of_age is the flock's age in whole weeks, matching how the standards are
-- published, so a row lines up with its standard without any date arithmetic.
--
-- birds_weighed is kept because an average from 20 birds and one from 200 are
-- not equally trustworthy, and a screen that hides the sample size invites
-- treating them the same.

CREATE TABLE IF NOT EXISTS public.flock_weekly_performance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_id       uuid NOT NULL,
  week_of_age    int  NOT NULL,
  sex            text NOT NULL DEFAULT 'Female' CHECK (sex IN ('Female','Male')),
  week_ending    date,
  avg_body_weight_g numeric,
  birds_weighed  int,
  uniformity_pct numeric,
  cv_pct         numeric,
  remarks        text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (flock_id, week_of_age, sex)
);

CREATE INDEX IF NOT EXISTS idx_fwp_flock ON public.flock_weekly_performance (flock_id, week_of_age);

-- RLS WITH a policy. Enabling row security without one denies every write --
-- the fault that broke the Cull Bird page on the day it shipped.
ALTER TABLE public.flock_weekly_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all" ON public.flock_weekly_performance;
CREATE POLICY "auth_all" ON public.flock_weekly_performance FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS columns_created
FROM information_schema.columns WHERE table_schema='public' AND table_name='flock_weekly_performance';

SELECT (SELECT COUNT(*) FROM public.flock_weekly_performance)::text AS rows_now,
       (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname='public' AND tablename='flock_weekly_performance') AS policies;

-- The flocks the template will offer, with their placement dates and seasons,
-- so the sheet can be filled in with the right ages.
SELECT COALESCE(string_agg('F-' || flock_no || ' placed ' || to_char(placement_date,'DD/MM/YYYY')
       || ' (' || COALESCE(laying_season,'no season') || ')', ' | ' ORDER BY flock_no), 'NONE') AS flocks_available
FROM public.flocks WHERE placement_date IS NOT NULL AND COALESCE(is_vhl_contract,false) = false;
