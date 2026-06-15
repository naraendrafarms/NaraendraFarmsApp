-- Make employee FK constraints CASCADE on delete
-- so deleting an employee automatically cleans up salary and bonus records

ALTER TABLE public.salary_monthly
  DROP CONSTRAINT IF EXISTS salary_monthly_employee_id_fkey,
  ADD CONSTRAINT salary_monthly_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.bonus
  DROP CONSTRAINT IF EXISTS bonus_employee_id_fkey,
  ADD CONSTRAINT bonus_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
