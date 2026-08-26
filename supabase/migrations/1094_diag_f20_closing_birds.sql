-- Flock 20 closing-birds diagnosis: per-shed latest row, and formula violations.
-- Read-only.

-- 1) Latest row per shed for Flock 20, with the closing it contributes
SELECT string_agg(
  fm.name || '/Sh' || s.shed_no || ' @' || x.record_date::text
    || ' close=' || COALESCE(x.closing_female,0)::text || '/' || COALESCE(x.closing_male,0)::text,
  ' | ' ORDER BY fm.name, s.shed_no) AS latest_per_shed
FROM (
  SELECT DISTINCT ON (shed_id) shed_id, record_date, closing_female, closing_male
  FROM public.daily_records
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id IS NOT NULL
  ORDER BY shed_id, record_date DESC
) x
JOIN public.sheds s ON s.id = x.shed_id
JOIN public.farms fm ON fm.id = s.farm_id;

-- 2) Sum of those latest closings = what the flock should show as alive
SELECT sum(COALESCE(x.closing_female,0))::int AS total_close_f,
       sum(COALESCE(x.closing_male,0))::int AS total_close_m
FROM (
  SELECT DISTINCT ON (shed_id) shed_id, closing_female, closing_male
  FROM public.daily_records
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id IS NOT NULL
  ORDER BY shed_id, record_date DESC
) x;

-- 3) Rows where closing != opening - mortality - cull - transfer (formula broken)
SELECT count(*)::int AS n_formula_violations,
       min(record_date)::text AS first_bad, max(record_date)::text AS last_bad
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND closing_female IS NOT NULL AND opening_female IS NOT NULL
  AND closing_female <> (COALESCE(opening_female,0) + COALESCE(received_female,0)
        - COALESCE(mortality_female,0) - COALESCE(cull_female,0) - COALESCE(transfer_female,0));
