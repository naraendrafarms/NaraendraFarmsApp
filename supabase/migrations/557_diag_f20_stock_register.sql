-- Diagnostic only (no schema changes) — Daily Stock Register (HE Dispatch)
-- shows a NEGATIVE grade balance for Flock 20 around 2026-07-14, and the
-- user says Bulk Daily Entry shows different numbers for the same dates.
-- The register computes: balance = opening + production(A/B/C) − dispatched
-- (A/B/C) − wastage_he − conversions-out-of-grade-C. A negative balance means
-- more was dispatched in that grade than was ever produced + opening.
-- Comparing all four inputs for Flock 20 across the surrounding fortnight.

-- 1. Production per day from daily_records (what Bulk Daily Entry writes)
SELECT 'production' AS src, record_date,
  SUM(he_grade_a) AS grade_a, SUM(he_grade_b) AS grade_b, SUM(he_grade_c) AS grade_c,
  SUM(he_eggs) AS he_eggs_total, SUM(wastage_he) AS wastage_he, COUNT(*) AS shed_rows
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20')
  AND record_date BETWEEN '2026-07-05' AND '2026-07-20'
GROUP BY record_date ORDER BY record_date;

-- 2. Dispatched per day from he_dispatch_lines (what the register subtracts)
SELECT 'dispatch' AS src, d.dispatch_date,
  SUM(l.grade_a) AS grade_a, SUM(l.grade_b) AS grade_b, SUM(l.grade_c) AS grade_c,
  SUM(COALESCE(l.grade_a,0)+COALESCE(l.grade_b,0)+COALESCE(l.grade_c,0)) AS line_total,
  COUNT(*) AS line_rows
FROM public.he_dispatch_lines l
JOIN public.he_dispatch d ON d.id = l.he_dispatch_id
WHERE l.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20')
  AND d.dispatch_date BETWEEN '2026-07-05' AND '2026-07-20'
GROUP BY d.dispatch_date ORDER BY d.dispatch_date;

-- 3. Header totals for the same dispatches — if header total_dispatched does
--    NOT match the sum of its grade lines, the grade split is wrong/missing
--    and the register will drift from what Bulk Daily Entry implies.
SELECT 'dispatch_header' AS src, d.dispatch_date, d.dc_no, d.total_dispatched, d.free_eggs,
  (SELECT COALESCE(SUM(COALESCE(l.grade_a,0)+COALESCE(l.grade_b,0)+COALESCE(l.grade_c,0)),0)
     FROM public.he_dispatch_lines l WHERE l.he_dispatch_id = d.id) AS sum_of_lines
FROM public.he_dispatch d
WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20')
  AND d.dispatch_date BETWEEN '2026-07-05' AND '2026-07-20'
ORDER BY d.dispatch_date;

-- 4. Opening stock + conversions (the other two inputs)
SELECT 'opening' AS src, he_grade_a, he_grade_b, he_grade_c, as_of_date
FROM public.egg_opening_stock
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20');

SELECT 'conversions' AS src, conversion_date, from_type, from_qty, to_type, to_qty
FROM public.egg_conversions
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20')
ORDER BY conversion_date;

SELECT 'sentinel' AS marker, 1 AS n;
