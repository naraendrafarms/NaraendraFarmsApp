-- READ ONLY. 1285 reported "5 statements. Done. Errors: 0" and printed NOTHING,
-- because DDL and an INSERT return no rows and the runner omits those - and it
-- also treats "already exists" / "does not exist" as success. So that green is
-- worth nothing on its own. Every check below is an aggregate, so it always
-- returns exactly one row: a zero is a real answer, not a missing statement.

SELECT count(*)::int AS columns_found,
       count(*) FILTER (WHERE column_name = 'employee_id')::int AS has_employee_id,
       count(*) FILTER (WHERE column_name = 'joined_date')::int AS has_joined_date,
       count(*) FILTER (WHERE column_name = 'left_date')::int   AS has_left_date,
       count(*) FILTER (WHERE column_name = 'reason')::int      AS has_reason
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employment_spells';

SELECT count(*)::int AS policies,
       count(*) FILTER (WHERE policyname = 'employment_spells_read')::int  AS read_policy,
       count(*) FILTER (WHERE policyname = 'employment_spells_write')::int AS write_policy,
       (SELECT count(*)::int FROM pg_tables
        WHERE schemaname='public' AND tablename='employment_spells' AND rowsecurity) AS rls_on
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employment_spells';

SELECT count(*)::int AS delete_trigger_on_employees,
       (SELECT count(*)::int FROM pg_proc
        WHERE proname = 'fn_del_employment_spells') AS trigger_function
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table = 'employees'
  AND trigger_name = 'trg_del_employment_spells';

SELECT (SELECT count(*)::int FROM public.employment_spells) AS spells_total,
       (SELECT count(DISTINCT employee_id)::int FROM public.employment_spells) AS employees_with_a_spell,
       (SELECT count(*)::int FROM public.employees WHERE joining_date IS NOT NULL) AS employees_with_joining_date,
       (SELECT count(*)::int FROM public.employees e
         WHERE NOT EXISTS (SELECT 1 FROM public.employment_spells s WHERE s.employee_id = e.id)) AS employees_falling_back,
       (SELECT count(*)::int FROM public.employment_spells WHERE left_date IS NOT NULL) AS closed_spells,
       (SELECT count(*)::int FROM public.employees) AS employees_total;

-- Nothing about the employees table itself may have moved: this migration was
-- INSERT only into a brand new table.
SELECT count(*)::int AS employees_now,
       count(*) FILTER (WHERE joining_date IS NOT NULL)::int AS with_joining_date,
       count(*) FILTER (WHERE leaving_date IS NOT NULL)::int AS with_leaving_date,
       count(*) FILTER (WHERE COALESCE(is_active,true))::int AS active
FROM public.employees;
