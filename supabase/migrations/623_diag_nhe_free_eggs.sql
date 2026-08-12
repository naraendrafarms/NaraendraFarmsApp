-- Diagnostic only (no schema changes, no data changes).
--
-- nhe_sale_lines.free_qty is eggs given away free. The app's own comment says
-- they "count as stock leaving (same as HE Dispatch's free_eggs) but are never
-- billed" — but EggStock only ever deducts the billed `quantity`, so every free
-- egg is still sitting in stock. HE is unaffected: there, free eggs are inside
-- the grade quantities and already leave stock.
--
-- Measure the overstatement before changing anything: how many free eggs, of
-- which types, over what period, and for which flocks.

-- 1. The headline number, by egg type.
SELECT COALESCE(string_agg(t || '=' || q, ', ' ORDER BY q DESC), 'NONE') AS free_eggs_by_type,
       (SELECT COALESCE(SUM(free_qty), 0) FROM public.nhe_sale_lines) AS total_free_eggs,
       (SELECT COUNT(*) FROM public.nhe_sale_lines WHERE COALESCE(free_qty,0) > 0) AS lines_with_free
FROM (
  SELECT COALESCE(sale_type,'(none)') AS t, SUM(COALESCE(free_qty,0)) AS q
  FROM public.nhe_sale_lines WHERE COALESCE(free_qty,0) > 0 GROUP BY 1
) x;

-- 2. Per flock — this is the stock each flock is currently overstated by.
SELECT COALESCE(string_agg('F-' || f.flock_no || ': ' || q, ' | ' ORDER BY q DESC), 'NONE') AS overstated_by_flock
FROM (
  SELECT s.flock_id, SUM(COALESCE(l.free_qty,0)) AS q
  FROM public.nhe_sale_lines l
  JOIN public.nhe_sales s ON s.id = l.sale_id
  WHERE COALESCE(l.free_qty,0) > 0
  GROUP BY s.flock_id
) g JOIN public.flocks f ON f.id = g.flock_id;

-- 3. Over what period, so it is clear whether this is historic or ongoing.
SELECT MIN(s.sale_date)::text AS first_free_sale,
       MAX(s.sale_date)::text AS last_free_sale,
       COUNT(DISTINCT s.id) AS sales_involving_free
FROM public.nhe_sale_lines l
JOIN public.nhe_sales s ON s.id = l.sale_id
WHERE COALESCE(l.free_qty,0) > 0;

-- 4. The OTHER shape: older sales saved without lines, where EggStock falls
--    back to nhe_sales.quantity. Does that path carry a free quantity at all?
--    If nhe_sales has no free column, single-line sales can only ever have
--    recorded free eggs by including them in quantity — which would already
--    reduce stock correctly, and must NOT be deducted twice by the fix.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'NO FREE COLUMN ON nhe_sales') AS nhe_sales_free_columns,
       (SELECT COUNT(*) FROM public.nhe_sales s
        WHERE NOT EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id)) AS sales_without_lines,
       (SELECT COUNT(*) FROM public.nhe_sales s
        WHERE EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id)) AS sales_with_lines
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nhe_sales' AND column_name LIKE '%free%';

-- 5. Context: total NHE eggs billed, so the free quantity can be judged against
--    it rather than read as a bare number.
SELECT (SELECT COALESCE(SUM(quantity), 0) FROM public.nhe_sale_lines) AS total_billed_eggs_on_lines,
       (SELECT COALESCE(SUM(free_qty), 0) FROM public.nhe_sale_lines) AS total_free_eggs,
       ROUND(100.0 * (SELECT COALESCE(SUM(free_qty),0) FROM public.nhe_sale_lines)
             / NULLIF((SELECT COALESCE(SUM(quantity),0) FROM public.nhe_sale_lines), 0), 2) AS free_pct_of_billed;
