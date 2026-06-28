-- Migration 207: remove duplicate employee_deductions rows. The same bird/egg sale was
-- recorded twice for some employees (one manual row with nhe_sale_id NULL + one auto row
-- linked to the sale), doubling their deduction (e.g. Abhagi Das 656 instead of 328).
-- Keep ONE row per (employee, amount, description, month) — preferring the linked row
-- (nhe_sale_id NOT NULL) then the newest — and delete the rest. User confirmed the lower
-- (single) figure is correct.

-- Safety backup
CREATE TABLE IF NOT EXISTS public.employee_deductions_backup_207 AS
SELECT * FROM public.employee_deductions;

-- Total before
SELECT 'before' AS chk, COUNT(*) AS rows, SUM(amount) AS total FROM public.employee_deductions;

-- Delete duplicates, keeping the best row per group
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY employee_id, amount, COALESCE(description,''), COALESCE(deduction_month::text,'')
      ORDER BY (nhe_sale_id IS NOT NULL) DESC, created_at DESC
    ) AS rn
  FROM public.employee_deductions
)
DELETE FROM public.employee_deductions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Total after (should match the correct ~single-count figure)
SELECT 'after' AS chk, COUNT(*) AS rows, SUM(amount) AS total FROM public.employee_deductions;

-- Spot check the previously-doubled employees
SELECT 'check' AS chk, e.name, SUM(d.amount) AS total
FROM public.employee_deductions d JOIN public.employees e ON e.id=d.employee_id
WHERE e.name IN ('Abhagi Das','Dipen Dolai')
GROUP BY e.name ORDER BY e.name;
