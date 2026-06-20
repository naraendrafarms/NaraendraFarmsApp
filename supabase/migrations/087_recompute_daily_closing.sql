-- Migration 087: One-time cleanup. Recompute stored closing_female/male for
-- every daily_record so it equals Opening - Transfer - Cull - Mortality.
-- Some older rows hold a stale closing (e.g. mortality edited before the
-- auto-recompute fix), which made the flock page show a count off by a few.
--
-- Deduction handles BOTH data shapes:
--   modern rows: separate transfer_x + cull_x (trcull_x = transfer_x + cull_x)
--   legacy rows: only trcull_x populated, transfer_x / cull_x null
-- GREATEST(transfer+cull, trcull) yields the right deduction either way.

UPDATE public.daily_records
SET
  closing_female = GREATEST(0,
    COALESCE(opening_female, 0)
    - GREATEST(COALESCE(transfer_female, 0) + COALESCE(cull_female, 0), COALESCE(trcull_female, 0))
    - COALESCE(mortality_female, 0)),
  closing_male = GREATEST(0,
    COALESCE(opening_male, 0)
    - GREATEST(COALESCE(transfer_male, 0) + COALESCE(cull_male, 0), COALESCE(trcull_male, 0))
    - COALESCE(mortality_male, 0))
WHERE
  closing_female IS DISTINCT FROM GREATEST(0,
    COALESCE(opening_female, 0)
    - GREATEST(COALESCE(transfer_female, 0) + COALESCE(cull_female, 0), COALESCE(trcull_female, 0))
    - COALESCE(mortality_female, 0))
  OR closing_male IS DISTINCT FROM GREATEST(0,
    COALESCE(opening_male, 0)
    - GREATEST(COALESCE(transfer_male, 0) + COALESCE(cull_male, 0), COALESCE(trcull_male, 0))
    - COALESCE(mortality_male, 0));

-- Diagnostic: count rows that STILL mismatch (should be 0 after the update).
SELECT COUNT(*) AS remaining_mismatches
FROM public.daily_records
WHERE
  closing_female IS DISTINCT FROM GREATEST(0,
    COALESCE(opening_female, 0)
    - GREATEST(COALESCE(transfer_female, 0) + COALESCE(cull_female, 0), COALESCE(trcull_female, 0))
    - COALESCE(mortality_female, 0))
  OR closing_male IS DISTINCT FROM GREATEST(0,
    COALESCE(opening_male, 0)
    - GREATEST(COALESCE(transfer_male, 0) + COALESCE(cull_male, 0), COALESCE(trcull_male, 0))
    - COALESCE(mortality_male, 0));

NOTIFY pgrst, 'reload schema';
