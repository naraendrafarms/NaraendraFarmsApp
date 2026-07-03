-- std_production_pct was NOT NULL from the table's original (single-column)
-- version. The rebuilt schema uses hen_week_pct/he_pct/etc. instead and
-- never sets this old column, so every insert/import violated the
-- constraint. Column is superseded, not dropped (in case anything still
-- reads it) — just make it optional.
ALTER TABLE public.std_production_curve ALTER COLUMN std_production_pct DROP NOT NULL;
SELECT 'ok' AS chk;
