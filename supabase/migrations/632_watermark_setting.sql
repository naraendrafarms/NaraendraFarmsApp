-- On-screen background watermark toggle.
--
-- The NF monogram sits faintly behind every page in the browser and on mobile.
-- It is a display preference, not farm data, so it lives on company_settings
-- next to the rest of the identity fields rather than in code — which also
-- means it can be switched off without a deploy if it annoys anyone on a small
-- screen.
--
-- Default TRUE: the watermark was asked for, so it is on unless turned off.
-- It never appears on printed output; printing is handled separately in
-- invoicePrint.ts and is deliberately untouched here.

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS show_watermark BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.company_settings.show_watermark IS
  'Show the faint NF monogram behind app pages on screen. Never affects print output.';

-- ── Verification (kept inside the first 5 statements so it actually prints —
--    run_sql.py truncates after that, which is how 621''s checks were lost) ──
SELECT COALESCE(string_agg(column_name || ' ' || data_type || ' default ' || COALESCE(column_default,'none'), ', '), 'MISSING — NOT ADDED') AS watermark_column
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'company_settings' AND column_name = 'show_watermark';

SELECT COUNT(*) AS settings_rows,
       COUNT(*) FILTER (WHERE show_watermark) AS watermark_on
FROM public.company_settings;

NOTIFY pgrst, 'reload schema';
