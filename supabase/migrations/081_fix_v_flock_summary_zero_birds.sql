-- Migration 081: Fix v_flock_summary current_female/male showing total_placed when birds = 0
--
-- BUG: NULLIF(closing_female, 0) converts genuine "0 birds remaining" into NULL,
--      then COALESCE falls back to total_placed_f — so a closed/empty flock shows
--      its original placement count instead of 0.
--
-- FIX: Only fall back to total_placed_f when there are NO daily records at all
--      (brand-new rearing flock). When records exist, use closing_female if > 0,
--      else opening_female if > 0 (today's closing not entered yet), else 0.

DROP VIEW IF EXISTS public.v_flock_summary;

CREATE VIEW public.v_flock_summary AS
SELECT
  f.id,
  f.flock_no,
  f.breed,
  f.status,
  f.placement_date,
  f.laying_start_date,
  f.rearing_farm_id,
  f.laying_farm_id,
  f.total_placed_f,
  f.total_placed_m,
  f.chick_cost,
  rf.name AS rearing_farm,
  lf.name AS laying_farm,
  lr.record_date AS last_record_date,
  -- current_female: fall back to total_placed_f ONLY when no daily records exist yet
  CASE
    WHEN lr.record_date IS NULL        THEN f.total_placed_f   -- no records yet (new/rearing flock)
    WHEN lr.closing_female > 0         THEN lr.closing_female  -- normal case
    WHEN lr.opening_female > 0         THEN lr.opening_female  -- closing not entered for today yet
    ELSE 0                                                      -- genuinely 0 birds remaining
  END AS current_female,
  -- current_male: same logic
  CASE
    WHEN lr.record_date IS NULL        THEN f.total_placed_m
    WHEN lr.closing_male > 0           THEN lr.closing_male
    WHEN lr.opening_male > 0           THEN lr.opening_male
    ELSE 0
  END AS current_male,
  COALESCE(ep.total_eggs, 0) AS total_eggs,
  COALESCE(ep.total_he,   0) AS total_he,
  CASE WHEN COALESCE(ep.total_eggs, 0) > 0
    THEN ROUND(ep.total_he::NUMERIC / ep.total_eggs, 4) ELSE 0 END AS he_pct,
  COALESCE(hr.he_revenue,  0) AS he_revenue,
  COALESCE(nr.nhe_revenue, 0) AS nhe_revenue
FROM public.flocks f
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
LEFT JOIN LATERAL (
  SELECT
    d.record_date,
    SUM(d.closing_female)  AS closing_female,
    SUM(d.closing_male)    AS closing_male,
    SUM(d.opening_female)  AS opening_female,
    SUM(d.opening_male)    AS opening_male
  FROM public.daily_records d
  WHERE d.flock_id = f.id
    AND d.record_date = (
      SELECT MAX(record_date) FROM public.daily_records WHERE flock_id = f.id
    )
  GROUP BY d.record_date
) lr ON true
LEFT JOIN LATERAL (
  SELECT SUM(total_eggs) AS total_eggs, SUM(he_eggs) AS total_he
  FROM public.daily_records WHERE flock_id = f.id
) ep ON true
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS he_revenue FROM public.he_dispatch WHERE flock_id = f.id
) hr ON true
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS nhe_revenue FROM public.nhe_sales WHERE flock_id = f.id
) nr ON true;

NOTIFY pgrst, 'reload schema';
