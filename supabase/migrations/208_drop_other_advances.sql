-- Migration 208: Option A single-source cleanup. Employee egg/bird purchases now live
-- ONLY in employee_deductions. Remove the duplicate employee_advances rows tagged
-- advance_type='other' (they were a redundant copy that caused two diverging totals).
-- Real cash/egg ADVANCES (advance_type 'cash'/'egg') are kept untouched.

CREATE TABLE IF NOT EXISTS public.employee_advances_other_backup_208 AS
SELECT * FROM public.employee_advances WHERE advance_type = 'other';

SELECT 'before' AS chk,
  COUNT(*) FILTER (WHERE advance_type='other')  AS other_rows,
  COUNT(*) FILTER (WHERE advance_type<>'other') AS real_advance_rows
FROM public.employee_advances;

DELETE FROM public.employee_advances WHERE advance_type = 'other';

SELECT 'after' AS chk,
  COUNT(*) FILTER (WHERE advance_type='other')  AS other_rows,
  COUNT(*) FILTER (WHERE advance_type<>'other') AS real_advance_rows,
  COALESCE(SUM(amount) FILTER (WHERE advance_type<>'other'),0) AS real_advance_total
FROM public.employee_advances;

-- Confirm the deductions source is intact
SELECT 'deductions' AS chk, COUNT(*) AS rows, SUM(amount) AS total
FROM public.employee_deductions;
