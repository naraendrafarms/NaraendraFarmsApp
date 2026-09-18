-- READ ONLY. 1265 found the HHF counter at 51 while invoices run to 77, and
-- 148 invoice numbers matching no series template. Look at both properly.
SELECT 1 AS warmup;

-- The shapes that match no series, so they can be recognised rather than guessed.
WITH used AS (
  SELECT invoice_no, 'he_dispatch' AS src FROM public.he_dispatch WHERE COALESCE(invoice_no,'') <> ''
  UNION ALL
  SELECT invoice_no, 'nhe_sales'   FROM public.nhe_sales  WHERE COALESCE(invoice_no,'') <> ''
), unmatched AS (
  SELECT u.* FROM used u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.invoice_series s
    WHERE u.invoice_no LIKE replace(replace(s.template,'{FY}',s.fy),'{N}','') || '%')
)
SELECT regexp_replace(invoice_no, '[0-9]+', 'N', 'g') AS shape,
       src, count(*)::int AS rows, min(invoice_no) AS example
FROM unmatched GROUP BY shape, src ORDER BY count(*) DESC LIMIT 15;

-- Every series counter against the highest number really used, so the size of
-- each correction is explicit rather than inferred.
WITH used AS (
  SELECT invoice_no FROM public.he_dispatch WHERE COALESCE(invoice_no,'') <> ''
  UNION ALL
  SELECT invoice_no FROM public.nhe_sales  WHERE COALESCE(invoice_no,'') <> ''
)
SELECT s.code, s.current_no,
       max(CASE WHEN u.invoice_no ~ '[0-9]+$'
                THEN (regexp_replace(u.invoice_no, '^.*/', ''))::int END) AS highest_used,
       count(u.invoice_no)::int AS invoices,
       max(CASE WHEN u.invoice_no ~ '[0-9]+$'
                THEN (regexp_replace(u.invoice_no, '^.*/', ''))::int END) - s.current_no AS counter_is_behind_by
FROM public.invoice_series s
LEFT JOIN used u
  ON u.invoice_no LIKE replace(replace(s.template,'{FY}',s.fy),'{N}','') || '%'
GROUP BY s.code, s.current_no ORDER BY s.code;

-- Which HE numbers are missing between 1 and its highest.
WITH used AS (
  SELECT (regexp_replace(invoice_no, '^.*/', ''))::int AS n
  FROM public.he_dispatch
  WHERE invoice_no LIKE 'NF/HE/26-27/%' AND invoice_no ~ '[0-9]+$'
)
SELECT string_agg(g::text, ', ' ORDER BY g) AS he_numbers_never_used
FROM generate_series(1, (SELECT max(n) FROM used)) g
WHERE g NOT IN (SELECT n FROM used);
