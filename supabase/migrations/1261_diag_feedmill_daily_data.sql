-- READ ONLY. What a Feed Mill block on Daily Summary could actually show.
-- Measured against the real tables rather than imagined.
SELECT 1 AS warmup;

SELECT (SELECT count(*)::int FROM public.feed_production_log)                    AS production_log_rows,
       (SELECT count(*)::int FROM public.feed_production_ingredients)            AS production_ingredient_rows,
       (SELECT count(*)::int FROM public.feed_transfers)                         AS feed_transfer_rows,
       (SELECT count(*)::int FROM public.feedmill_expenses)                      AS feedmill_expense_rows,
       (SELECT max(production_date)::text FROM public.feed_production_log)       AS last_production_date,
       (SELECT max(transfer_date)::text FROM public.feed_transfers)              AS last_transfer_date;

-- The most recent seven days that actually have production, so the block can
-- be designed around what a real day looks like.
SELECT p.production_date::text AS the_date,
       count(*)::int           AS batches,
       round(sum(p.quantity_kg))::int AS total_kg,
       count(DISTINCT p.formula_id)::int AS formulas
FROM public.feed_production_log p
GROUP BY p.production_date
ORDER BY p.production_date DESC
LIMIT 7;

-- Employees mapped to Feed Mill - the block currently says there are none.
SELECT f.name AS site,
       count(e.id)::int AS active_employees
FROM public.farms f
LEFT JOIN public.employees e ON e.farm_id = f.id AND e.is_active = true
WHERE f.name ILIKE '%feed%mill%'
GROUP BY f.name;
