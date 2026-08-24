-- Migration 846 (READ ONLY): what real sales/dispatch records exist for Flock 19
-- after its last surviving daily_records row (13/06/2026), to see what the
-- deleted 03/07/2026 record was likely reflecting.

SELECT 'f19_sales_after_last_record' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.sale_date::text || ' ' || s.sale_type || ' qty=' || COALESCE(s.quantity,0)
            || ' amt=' || COALESCE(s.amount,0) || ' shed=' || COALESCE(sh.shed_no,'none')) AS t
      FROM public.nhe_sales s
      JOIN public.flocks f ON f.id = s.flock_id
      LEFT JOIN public.sheds sh ON sh.id = s.shed_id
     WHERE f.flock_no::text = '19' AND s.sale_date > '2026-06-13'
     ORDER BY s.sale_date
  ) x;

SELECT 'f19_sales_after_count' AS chk, count(*)::int AS n,
       sum(quantity)::numeric AS total_qty
  FROM public.nhe_sales s
  JOIN public.flocks f ON f.id = s.flock_id
 WHERE f.flock_no::text = '19' AND s.sale_date > '2026-06-13';

-- Any HE dispatch records after that date too (in case birds themselves, not
-- just eggs, moved through a different table).
SELECT 'f19_he_dispatch_after' AS chk, count(*)::int AS n
  FROM public.he_dispatch h
  JOIN public.flocks f ON f.id = h.flock_id
 WHERE f.flock_no::text = '19' AND h.dispatch_date > '2026-06-13';

-- Cash book entries linked to Flock 19's NHE sales, dated after the last surviving record.
SELECT 'f19_cashbook_after' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (c.entry_date::text || ' ' || COALESCE(c.category,'?') || ' amt=' || COALESCE(c.amount,0)) AS t
      FROM public.cash_book c
      JOIN public.nhe_sales s2 ON s2.id = c.nhe_sale_id
      JOIN public.flocks f2 ON f2.id = s2.flock_id
     WHERE f2.flock_no::text = '19' AND c.entry_date > '2026-06-13'
  ) x;

-- What is the flock's own status/close_date right now (the other way it can show as gone)?
SELECT 'f19_status' AS chk, status, close_date::text FROM public.flocks WHERE flock_no::text='19';
