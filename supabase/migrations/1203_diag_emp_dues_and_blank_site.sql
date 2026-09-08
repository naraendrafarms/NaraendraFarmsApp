-- Read-only. Two questions:
--   (a) a gas sale recovered through salary still shows in Employee Dues;
--   (b) some sales show a dash instead of a site in the sales list.
-- A throwaway first statement, because the runner's first request sometimes
-- returns something it does not print, and a silent statement is worse than a
-- wasted one.
SELECT 1 AS warmup;

-- 1. Is there any live mechanism? 1158 corrected the history once by hand; if
--    no trigger exists on employee_deductions then nothing keeps nhe_sales in
--    step when a salary is paid, and the fault comes straight back.
SELECT count(*)::int AS triggers_on_employee_deductions,
       COALESCE(string_agg(tgname, ', '), 'NONE') AS names
FROM pg_trigger
WHERE tgrelid = 'public.employee_deductions'::regclass AND NOT tgisinternal;

-- 2. Sales whose money HAS been taken out of wages but which still read unpaid
SELECT count(*)::int AS sales_recovered_but_still_unpaid,
       COALESCE(sum(s.amount - COALESCE(s.amount_received,0)),0)::numeric AS shown_as_due,
       COALESCE(min(s.sale_date)::text,'-') || ' -> ' || COALESCE(max(s.sale_date)::text,'-') AS span,
       COALESCE(string_agg(DISTINCT s.sale_type, ', '), '-') AS sale_types
FROM public.nhe_sales s
WHERE s.is_employee_sale
  AND COALESCE(s.payment_status,'Pending') <> 'Received'
  AND EXISTS (SELECT 1 FROM public.employee_deductions d
              WHERE d.nhe_sale_id = s.id AND d.status = 'deducted');

-- 3. What the Employee Dues panel shows against what is really still owed once
--    deductions already taken are counted
SELECT COALESCE(e.name,'-') AS employee,
       round(sum(s.amount - COALESCE(s.amount_received,0)))::numeric AS panel_shows_due,
       round(sum(GREATEST(0, s.amount - COALESCE(s.amount_received,0)
              - COALESCE((SELECT sum(d.amount) FROM public.employee_deductions d
                          WHERE d.nhe_sale_id = s.id AND d.status = 'deducted'),0))))::numeric AS really_due
FROM public.nhe_sales s
LEFT JOIN public.employees e ON e.id = s.employee_id
WHERE s.is_employee_sale
GROUP BY e.name
HAVING sum(s.amount - COALESCE(s.amount_received,0)) <> 0
ORDER BY 2 DESC LIMIT 12;

-- 4. The dash in the Site column: a sale shows one when it created no cash book
--    row. Split those by how they were actually settled, so the dash can be
--    explained rather than guessed at.
SELECT count(*)::int AS sales_with_no_cash_book_row,
       count(*) FILTER (WHERE COALESCE(s.payment_online,0) > 0)::int AS settled_online,
       count(*) FILTER (WHERE s.is_employee_sale)::int AS employee_sales,
       count(*) FILTER (WHERE COALESCE(s.payment_status,'Pending') = 'Pending')::int AS still_unpaid,
       count(*) FILTER (WHERE COALESCE(s.payment_cash,0) > 0)::int AS carry_cash_but_no_row
FROM public.nhe_sales s
WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id);
