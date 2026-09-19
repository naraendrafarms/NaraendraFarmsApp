-- Employment spells: one row per stint, so a man who leaves and rejoins keeps
-- BOTH stints instead of one date being overwritten by the other.
--
-- Today employees holds a single joining_date and a single leaving_date, and
-- three screens each ask a different question from them: Daily Attendance
-- filters on is_active alone, the Monthly grid allows is_active OR the dates,
-- and Bulk Salary uses the dates and ignores is_active. Measured 19/09/2026:
-- 268 employees, 230 with no joining date at all, 0 with a leaving date.
--
-- SAFE BY DESIGN: an employee with NO spell row falls back to exactly the
-- behaviour they have today. Only the 38 employees who actually have a joining
-- date get a spell here, so the 230 whose dates predate the app are untouched
-- and keep appearing everywhere they appear now.
--
-- INSERT only. No existing row is updated or deleted, so no backup is needed.
-- Verified separately in 1286 rather than here, because the job log prints
-- only the first five statements and a verify sitting sixth proves nothing.

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.employment_spells (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id  UUID NOT NULL REFERENCES public.employees(id),
    joined_date  DATE NOT NULL,
    left_date    DATE,
    reason       TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT employment_spells_order CHECK (left_date IS NULL OR left_date >= joined_date)
  );

  CREATE INDEX IF NOT EXISTS idx_employment_spells_emp
    ON public.employment_spells(employee_id, joined_date);

  ALTER TABLE public.employment_spells ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "employment_spells_read" ON public.employment_spells;
  CREATE POLICY "employment_spells_read" ON public.employment_spells FOR SELECT
    USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "employment_spells_write" ON public.employment_spells;
  CREATE POLICY "employment_spells_write" ON public.employment_spells FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.id = (SELECT auth.uid()) AND p.is_active
                     AND p.role IN ('admin','accounts','site_manager')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.id = (SELECT auth.uid()) AND p.is_active
                     AND p.role IN ('admin','accounts','site_manager')));
END
$$;

-- A DELETE trigger rather than FK CASCADE, per the house rule. Employees ARE
-- deleted by the app - the bulk delete and the duplicate merge both do it - so
-- a plain FK with no cleanup would start refusing those deletes.
CREATE OR REPLACE FUNCTION public.fn_del_employment_spells()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.employment_spells WHERE employee_id = OLD.id;
  RETURN OLD;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_del_employment_spells ON public.employees;

CREATE TRIGGER trg_del_employment_spells
  BEFORE DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.fn_del_employment_spells();

INSERT INTO public.employment_spells (employee_id, joined_date, left_date, reason)
SELECT e.id, e.joining_date, e.leaving_date, 'Opening stint, from the employee record'
FROM public.employees e
WHERE e.joining_date IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employment_spells s WHERE s.employee_id = e.id);
