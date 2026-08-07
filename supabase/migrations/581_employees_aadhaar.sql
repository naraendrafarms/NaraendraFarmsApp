-- Aadhaar number on the employee record. PAN, ESI and UAN were already
-- captured; Aadhaar was never added, so there was nowhere to record it.
--
-- Stored as TEXT, not a number: leading zeros are significant and it is an
-- identifier, never something to do arithmetic on. No CHECK constraint on the
-- format — a wrong-length entry should warn the person typing it, not have the
-- database reject the save and lose the rest of the form.

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS aadhaar_no TEXT;

-- Verification (leading statements so run_sql.py echoes them).
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'MISSING') AS id_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employees'
  AND column_name IN ('pan_no', 'uan_no', 'esi_no', 'aadhaar_no');

SELECT COUNT(*) AS employees_total,
       COUNT(aadhaar_no) AS with_aadhaar
FROM public.employees;

NOTIFY pgrst, 'reload schema';
