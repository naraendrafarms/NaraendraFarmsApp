ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS tds_pct_default NUMERIC(5,2) DEFAULT 0;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'parties'
  AND column_name = 'tds_pct_default';

NOTIFY pgrst, 'reload schema';
