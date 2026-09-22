-- READ ONLY. No INSERT, UPDATE, DELETE or DDL. Nothing is written.
SELECT 'salary_allocation rows=' || (SELECT COUNT(*) FROM public.salary_allocation)
    || ' flocks=' || (SELECT COUNT(DISTINCT flock_id) FROM public.salary_allocation)
    || ' | electricity_allocation rows=' || (SELECT COUNT(*) FROM public.electricity_allocation)
    || ' flocks=' || (SELECT COUNT(DISTINCT flock_id) FROM public.electricity_allocation)
    || ' | v_flock_expense_allocation rows=' || (SELECT COUNT(*) FROM public.v_flock_expense_allocation)
    || ' flocks=' || (SELECT COUNT(DISTINCT flock_id) FROM public.v_flock_expense_allocation)
    AS allocation_state;

SELECT string_agg(line, ' || ' ORDER BY flock_no) AS per_flock_alloc
FROM (
  SELECT f.flock_no,
         'F' || f.flock_no
           || ' elecMonths=' || (SELECT COUNT(DISTINCT to_char(b.bill_month,'YYYY-MM'))
                FROM public.electricity_allocation ea
                JOIN public.electricity_bills b ON b.id = ea.bill_id
               WHERE ea.flock_id = f.id)
           || ' elecAmt=' || COALESCE((SELECT ROUND(SUM(ea.allocated_amount)) FROM public.electricity_allocation ea
               WHERE ea.flock_id = f.id)::text, '0')
           || ' expMonths=' || (SELECT COUNT(DISTINCT to_char(v.expense_date,'YYYY-MM'))
                FROM public.v_flock_expense_allocation v WHERE v.flock_id = f.id)
           || ' expAmt=' || COALESCE((SELECT ROUND(SUM(v.allocated_amount)) FROM public.v_flock_expense_allocation v
               WHERE v.flock_id = f.id)::text, '0')
           AS line
    FROM public.flocks f
   WHERE f.flock_no IN ('19','20','22','23')
) s;
