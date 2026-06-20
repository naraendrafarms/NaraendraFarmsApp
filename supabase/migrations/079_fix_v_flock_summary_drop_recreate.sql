-- Migration 079: Fix v_flock_summary by dropping and recreating.
-- Migrations 074 and 075 both failed with "cannot change name of view column"
-- because CREATE OR REPLACE VIEW cannot reorder or rename columns.
-- Solution: DROP first, then CREATE.

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
  -- Fall back to total_placed when no daily records exist yet (new/rearing flocks)
  COALESCE(NULLIF(lr.closing_female, 0), lr.opening_female, f.total_placed_f) AS current_female,
  COALESCE(NULLIF(lr.closing_male,   0), lr.opening_male,   f.total_placed_m) AS current_male,
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
  -- SUM across all sheds for the latest date so multi-shed flocks show correct totals
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

-- Re-apply RLS / grants if needed (views inherit from underlying tables)
NOTIFY pgrst, 'reload schema';
