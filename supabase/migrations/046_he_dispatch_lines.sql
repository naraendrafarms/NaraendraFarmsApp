-- Migration 046: HE Dispatch Lines — one row per production date per dispatch
-- he_dispatch becomes the header; he_dispatch_lines holds per-date grade quantities
CREATE TABLE IF NOT EXISTS public.he_dispatch_lines (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id  UUID NOT NULL REFERENCES public.he_dispatch(id) ON DELETE CASCADE,
  flock_id     UUID REFERENCES public.flocks(id),
  prod_date    DATE NOT NULL,
  grade_a      INTEGER NOT NULL DEFAULT 0,
  grade_b      INTEGER NOT NULL DEFAULT 0,
  grade_c      INTEGER NOT NULL DEFAULT 0,
  rate         NUMERIC(10,4),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing dispatch rows into lines (one line per dispatch using prod_date)
INSERT INTO public.he_dispatch_lines (dispatch_id, flock_id, prod_date, grade_a, grade_b, grade_c, rate)
SELECT
  id,
  flock_id,
  COALESCE(prod_date, dispatch_date),
  COALESCE(grade_a, 0),
  COALESCE(grade_b, 0),
  0,
  rate
FROM public.he_dispatch
WHERE total_dispatched IS NOT NULL;

NOTIFY pgrst, 'reload schema';
