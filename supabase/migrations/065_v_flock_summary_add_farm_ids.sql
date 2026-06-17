-- Migration 065: Add laying_farm_id and rearing_farm_id to v_flock_summary
-- Required so PostgREST can filter by farm (applyFarmFilter) and edit form gets FK values

CREATE OR REPLACE VIEW public.v_flock_summary AS
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
  -- Latest record (use opening when closing is missing)
  lr.record_date AS last_record_date,
  COALESCE(NULLIF(lr.closing_female, 0), lr.opening_female) AS current_female,
  COALESCE(NULLIF(lr.closing_male,   0), lr.opening_male)   AS current_male,
  -- Cumulative production
  COALESCE(ep.total_eggs, 0) AS total_eggs,
  COALESCE(ep.total_he,   0) AS total_he,
  CASE WHEN COALESCE(ep.total_eggs,0) > 0
    THEN ROUND(ep.total_he::NUMERIC/ep.total_eggs,4) ELSE 0 END AS he_pct,
  -- Revenue
  COALESCE(hr.he_revenue,  0) AS he_revenue,
  COALESCE(nr.nhe_revenue, 0) AS nhe_revenue
FROM public.flocks f
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
LEFT JOIN LATERAL (
  SELECT record_date, closing_female, closing_male, opening_female, opening_male
  FROM public.daily_records
  WHERE flock_id = f.id
  ORDER BY record_date DESC LIMIT 1
) lr ON true
LEFT JOIN LATERAL (
  SELECT SUM(total_eggs) AS total_eggs, SUM(he_eggs) AS total_he
  FROM public.daily_records WHERE flock_id = f.id
) ep ON true
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS he_revenue
  FROM public.he_dispatch WHERE flock_id = f.id
) hr ON true
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS nhe_revenue
  FROM public.nhe_sales WHERE flock_id = f.id
) nr ON true;

NOTIFY pgrst, 'reload schema';
