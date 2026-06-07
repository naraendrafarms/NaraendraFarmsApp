-- Fix hatch_pct values stored as percentages (75.9) instead of fractions (0.759)
-- Only update rows where hatch_pct > 1 (clearly stored as percentage)
UPDATE public.hatchability
SET hatch_pct = ROUND(hatch_pct / 100, 6)
WHERE hatch_pct > 1;
