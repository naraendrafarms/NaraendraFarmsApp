-- Company PAN belongs in the company profile alongside GSTIN and TAN, not in
-- application code. TAN already lives here (migration 460); PAN did not, so
-- the TDS statement had nowhere to read it from.
--
-- Backfilled from GSTIN, which contains the PAN as characters 3-12
-- (36 ABJFM1393C 1ZC), so the field arrives already correct and is editable
-- from Admin Centre afterwards.

ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS pan_no TEXT;

UPDATE public.company_settings
SET pan_no = substring(trim(gstin) FROM 3 FOR 10)
WHERE COALESCE(trim(pan_no), '') = ''
  AND gstin IS NOT NULL
  AND length(trim(gstin)) >= 12;

-- Verification (leading statements so run_sql.py actually echoes them).
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'MISSING') AS id_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'company_settings'
  AND column_name IN ('gstin', 'pan_no', 'tan_no');

SELECT company_name, gstin, pan_no, tan_no FROM public.company_settings;

NOTIFY pgrst, 'reload schema';
