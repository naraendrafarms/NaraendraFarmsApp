-- READ ONLY. What the invoice series counters say versus the invoice numbers
-- actually stored on he_dispatch and nhe_sales: duplicates, gaps, and whether
-- each counter is ahead of or behind the highest number really used.
SELECT 1 AS warmup;

SELECT code, label, template, fy, current_no, pad,
       replace(replace(template,'{FY}',fy),'{N}',
         CASE WHEN pad > 0 THEN lpad((current_no+1)::text, pad, '0') ELSE (current_no+1)::text END) AS next_would_be
FROM public.invoice_series ORDER BY code;

-- Every invoice number in use, with its numeric tail, from both tables.
WITH used AS (
  SELECT 'he_dispatch' AS src, invoice_no,
         NULLIF(regexp_replace(invoice_no, '^.*/', ''), '')::text AS tail
  FROM public.he_dispatch WHERE invoice_no IS NOT NULL AND invoice_no <> ''
  UNION ALL
  SELECT 'nhe_sales', invoice_no,
         NULLIF(regexp_replace(invoice_no, '^.*/', ''), '')::text
  FROM public.nhe_sales WHERE invoice_no IS NOT NULL AND invoice_no <> ''
), tagged AS (
  SELECT u.*, s.code,
         CASE WHEN u.tail ~ '^[0-9]+$' THEN u.tail::int END AS n
  FROM used u
  LEFT JOIN public.invoice_series s
    ON u.invoice_no LIKE replace(replace(s.template,'{FY}',s.fy),'{N}','') || '%'
)
SELECT COALESCE(code,'(no series matched)') AS series,
       count(*)::int                       AS invoices,
       count(*) FILTER (WHERE n IS NULL)::int AS non_numeric_tail,
       min(n)                              AS lowest,
       max(n)                              AS highest,
       count(DISTINCT n)::int              AS distinct_numbers,
       (count(*) FILTER (WHERE n IS NOT NULL) - count(DISTINCT n))::int AS duplicate_rows
FROM tagged
GROUP BY code ORDER BY code;

-- The duplicates themselves, if any.
WITH used AS (
  SELECT invoice_no FROM public.he_dispatch WHERE invoice_no IS NOT NULL AND invoice_no <> ''
  UNION ALL
  SELECT invoice_no FROM public.nhe_sales  WHERE invoice_no IS NOT NULL AND invoice_no <> ''
)
SELECT invoice_no, count(*)::int AS times_used
FROM used GROUP BY invoice_no HAVING count(*) > 1 ORDER BY count(*) DESC, invoice_no LIMIT 20;
