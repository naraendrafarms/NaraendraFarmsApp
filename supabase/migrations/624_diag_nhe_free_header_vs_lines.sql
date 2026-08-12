-- Diagnostic only. 623 answered the size (630 free eggs, all Flock 20,
-- 03/07/2026-03/08/2026, 0.50% of billed) but raised a second question:
--
--   nhe_sales_free_columns: free_qty      <- the HEADER has its own free_qty
--   sales_without_lines: 248   sales_with_lines: 188
--
-- EggStock reads lines when they exist and falls back to nhe_sales.quantity
-- when they don't. So the fix has to deduct free eggs on BOTH paths — and 623
-- only counted the LINES. Two things must be established before writing it:
--
--   a) do the 248 line-less sales carry free_qty? If so they are overstating
--      stock too and 630 is not the whole number.
--   b) on sales that DO have lines, is the header free_qty also populated?
--      If it is, adding header + lines would deduct the same eggs twice —
--      turning an understated deduction into an overstated one.

-- 1. Free eggs on LINE-LESS sales — the path 623 never looked at.
SELECT COUNT(*) AS lineless_sales_with_free,
       COALESCE(SUM(s.free_qty), 0) AS lineless_free_eggs
FROM public.nhe_sales s
WHERE COALESCE(s.free_qty, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id);

-- 2. The double-count risk: sales that have lines AND a header free_qty.
SELECT COUNT(*) AS sales_with_lines_and_header_free,
       COALESCE(SUM(s.free_qty), 0) AS header_free_on_those,
       COALESCE((SELECT SUM(l.free_qty) FROM public.nhe_sale_lines l
                 WHERE l.sale_id IN (SELECT id FROM public.nhe_sales s2
                                     WHERE COALESCE(s2.free_qty,0) > 0
                                       AND EXISTS (SELECT 1 FROM public.nhe_sale_lines l2 WHERE l2.sale_id = s2.id))), 0) AS line_free_on_those
FROM public.nhe_sales s
WHERE COALESCE(s.free_qty, 0) > 0
  AND EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id);

-- 3. The true total to be deducted, counting each sale once: lines where they
--    exist, header where they don't. This is the number the fix must produce.
SELECT COALESCE(SUM(free), 0) AS true_total_free_eggs,
       COUNT(*) FILTER (WHERE free > 0) AS sales_with_free
FROM (
  SELECT s.id,
         CASE WHEN EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id)
              THEN COALESCE((SELECT SUM(l.free_qty) FROM public.nhe_sale_lines l WHERE l.sale_id = s.id), 0)
              ELSE COALESCE(s.free_qty, 0) END AS free
  FROM public.nhe_sales s
) x;

-- 4. By type and flock on the true basis, so the correction is nameable.
SELECT COALESCE(string_agg('F-' || f.flock_no || ' ' || t || '=' || q, ' | ' ORDER BY q DESC), 'NONE') AS free_by_flock_and_type
FROM (
  SELECT s.flock_id, COALESCE(l.sale_type, s.sale_type) AS t, SUM(COALESCE(l.free_qty,0)) AS q
  FROM public.nhe_sales s JOIN public.nhe_sale_lines l ON l.sale_id = s.id
  WHERE COALESCE(l.free_qty,0) > 0
  GROUP BY s.flock_id, COALESCE(l.sale_type, s.sale_type)
  UNION ALL
  SELECT s.flock_id, s.sale_type, SUM(COALESCE(s.free_qty,0))
  FROM public.nhe_sales s
  WHERE COALESCE(s.free_qty,0) > 0
    AND NOT EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id)
  GROUP BY s.flock_id, s.sale_type
) g JOIN public.flocks f ON f.id = g.flock_id;

-- 5. Does the header free_qty ever equal the sum of its own lines' free? If it
--    does on every such sale, the header is a mirror of the lines and only one
--    should ever be used — which is exactly what statement 3 assumes.
SELECT COUNT(*) AS sales_with_both,
       COUNT(*) FILTER (WHERE hdr = ln) AS header_equals_lines,
       COUNT(*) FILTER (WHERE hdr <> ln) AS header_differs_from_lines
FROM (
  SELECT s.id, COALESCE(s.free_qty,0) AS hdr,
         COALESCE((SELECT SUM(l.free_qty) FROM public.nhe_sale_lines l WHERE l.sale_id = s.id), 0) AS ln
  FROM public.nhe_sales s
  WHERE EXISTS (SELECT 1 FROM public.nhe_sale_lines l WHERE l.sale_id = s.id)
    AND (COALESCE(s.free_qty,0) > 0
         OR COALESCE((SELECT SUM(l.free_qty) FROM public.nhe_sale_lines l WHERE l.sale_id = s.id), 0) > 0)
) y;
