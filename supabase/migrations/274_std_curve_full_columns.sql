-- The STD Production Curve table only had (season, week_of_age, pct) — the
-- real Venco breed standard has many more columns per week (depletion, hen
-- week %, HE %, TE/HH, HE/HH, hatch %, chicks/HH — weekly and cumulative).
-- Table was never populated yet, so this is a safe additive rebuild.
ALTER TABLE public.std_production_curve
  ADD COLUMN IF NOT EXISTS cum_depletion_pct NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS hen_week_pct NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS he_pct NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS weekly_te_hh NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS cum_te_hh NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS weekly_he_hh NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS cum_he_hh NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS hatch_pct NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS weekly_chicks_hh NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS cum_chicks_hh NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS breed TEXT DEFAULT 'Vencobb430';

SELECT 'ok' AS chk;
