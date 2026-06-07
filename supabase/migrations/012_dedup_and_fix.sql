-- Migration 012: Add unique constraints to prevent duplicate seeding
-- and fix data issues

-- ── 1. DEDUP AND UNIQUE: he_dispatch ─────────────────────────────
DELETE FROM public.he_dispatch a
USING public.he_dispatch b
WHERE a.ctid > b.ctid
  AND a.flock_id = b.flock_id
  AND a.dispatch_date = b.dispatch_date
  AND COALESCE(a.dc_no::text, 'null')      = COALESCE(b.dc_no::text, 'null')
  AND COALESCE(a.prod_date::text, 'null')  = COALESCE(b.prod_date::text, 'null')
  AND a.total_dispatched = b.total_dispatched;

ALTER TABLE public.he_dispatch
  ADD CONSTRAINT he_dispatch_unique
  UNIQUE (flock_id, dispatch_date, dc_no, prod_date, total_dispatched);

-- ── 2. DEDUP AND UNIQUE: nhe_sales ───────────────────────────────
DELETE FROM public.nhe_sales a
USING public.nhe_sales b
WHERE a.ctid > b.ctid
  AND a.flock_id = b.flock_id
  AND a.sale_date = b.sale_date
  AND COALESCE(a.dc_no::text, 'null')     = COALESCE(b.dc_no::text, 'null')
  AND COALESCE(a.party_id::text, 'null')  = COALESCE(b.party_id::text, 'null')
  AND COALESCE(a.quantity::text, 'null')  = COALESCE(b.quantity::text, 'null');

ALTER TABLE public.nhe_sales
  ADD CONSTRAINT nhe_sales_unique
  UNIQUE (flock_id, sale_date, dc_no, party_id, quantity);

-- ── 3. DEDUP AND UNIQUE: bird_transfers ──────────────────────────
DELETE FROM public.bird_transfers a
USING public.bird_transfers b
WHERE a.ctid > b.ctid
  AND a.flock_id = b.flock_id
  AND a.transfer_date = b.transfer_date
  AND COALESCE(a.dc_no::text, 'null')       = COALESCE(b.dc_no::text, 'null')
  AND COALESCE(a.total_birds::text, 'null') = COALESCE(b.total_birds::text, 'null');

ALTER TABLE public.bird_transfers
  ADD CONSTRAINT bird_transfers_unique
  UNIQUE (flock_id, transfer_date, dc_no, total_birds);

-- ── 4. DEDUP AND UNIQUE: bird_sales ──────────────────────────────
DELETE FROM public.bird_sales a
USING public.bird_sales b
WHERE a.ctid > b.ctid
  AND a.flock_id = b.flock_id
  AND a.sale_date = b.sale_date
  AND COALESCE(a.party_id::text, 'null')  = COALESCE(b.party_id::text, 'null')
  AND COALESCE(a.quantity::text, 'null')  = COALESCE(b.quantity::text, 'null');

ALTER TABLE public.bird_sales
  ADD CONSTRAINT bird_sales_unique
  UNIQUE (flock_id, sale_date, party_id, quantity);

-- ── 5. DEDUP AND UNIQUE: medicine_usage ──────────────────────────
DELETE FROM public.medicine_usage a
USING public.medicine_usage b
WHERE a.ctid > b.ctid
  AND a.flock_id = b.flock_id
  AND a.usage_date = b.usage_date
  AND COALESCE(a.medicine_id::text, 'null') = COALESCE(b.medicine_id::text, 'null')
  AND COALESCE(a.quantity_used::text, 'null') = COALESCE(b.quantity_used::text, 'null');

ALTER TABLE public.medicine_usage
  ADD CONSTRAINT medicine_usage_unique
  UNIQUE (flock_id, usage_date, medicine_id, quantity_used);

-- ── 6. Fix F-17 flock status → closed ────────────────────────────
UPDATE public.flocks
SET status = 'closed', close_date = '2025-08-01'
WHERE flock_no = '17';

-- ── 7. Fix F-17 last daily record: closing_female was 0 on last day
-- Set closing = opening - mortality when closing is 0 but opening > 0
UPDATE public.daily_records dr
SET closing_female = dr.opening_female - COALESCE(dr.mortality_female, 0)
   ,closing_male   = dr.opening_male   - COALESCE(dr.mortality_male, 0)
FROM public.flocks f
WHERE dr.flock_id = f.id
  AND f.flock_no = '17'
  AND dr.record_date = '2025-08-01'
  AND dr.closing_female = 0
  AND dr.opening_female > 0;

-- ── 8. Fix v_flock_summary: use opening_female when closing is 0/NULL ──
CREATE OR REPLACE VIEW public.v_flock_summary AS
SELECT
  f.id,
  f.flock_no,
  f.breed,
  f.status,
  f.placement_date,
  f.laying_start_date,
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
