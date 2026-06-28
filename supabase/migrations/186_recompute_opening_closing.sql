-- Migration 186: Recompute daily opening/closing so each day's opening = previous day's closing
-- (chained per flock + shed, in date order). Closing = opening − mortality − transfer − cull.
-- The FIRST record per flock/shed keeps its stored opening (the placement/base).
-- A backup of current values is saved first so this is reversible.

-- ── Backup current values (reversible) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_records_openclose_backup_186 AS
  SELECT id, opening_female, opening_male, closing_female, closing_male, NOW() AS backed_up_at
  FROM public.daily_records;

-- ── Recompute (chain opening = previous closing) ────────────────────────────
DO $$
DECLARE
  r RECORD;
  last_key TEXT := NULL;
  prev_close_f INT := 0; prev_close_m INT := 0;
  open_f INT; open_m INT; ded_f INT; ded_m INT; close_f INT; close_m INT;
BEGIN
  FOR r IN
    SELECT id, flock_id, COALESCE(shed_id::text, '_flock_') AS shedk, record_date, created_at,
           opening_female, opening_male, mortality_female, mortality_male,
           transfer_female, transfer_male, cull_female, cull_male, trcull_female, trcull_male
    FROM public.daily_records
    ORDER BY flock_id, COALESCE(shed_id::text, '_flock_'), record_date, created_at
  LOOP
    -- deduction: prefer explicit transfer+cull; fall back to trcull when both are null
    ded_f := COALESCE(r.mortality_female,0)
           + CASE WHEN r.transfer_female IS NULL AND r.cull_female IS NULL
                  THEN COALESCE(r.trcull_female,0)
                  ELSE COALESCE(r.transfer_female,0) + COALESCE(r.cull_female,0) END;
    ded_m := COALESCE(r.mortality_male,0)
           + CASE WHEN r.transfer_male IS NULL AND r.cull_male IS NULL
                  THEN COALESCE(r.trcull_male,0)
                  ELSE COALESCE(r.transfer_male,0) + COALESCE(r.cull_male,0) END;

    IF (r.flock_id::text || '|' || r.shedk) IS DISTINCT FROM last_key THEN
      -- first record for this flock/shed → keep its own opening
      open_f := COALESCE(r.opening_female,0);
      open_m := COALESCE(r.opening_male,0);
    ELSE
      open_f := prev_close_f;
      open_m := prev_close_m;
    END IF;

    close_f := GREATEST(0, open_f - ded_f);
    close_m := GREATEST(0, open_m - ded_m);

    UPDATE public.daily_records
      SET opening_female = open_f, opening_male = open_m,
          closing_female = close_f, closing_male = close_m
      WHERE id = r.id;

    prev_close_f := close_f; prev_close_m := close_m;
    last_key := r.flock_id::text || '|' || r.shedk;
  END LOOP;
END $$;

-- ── Verify: any remaining day where opening <> previous closing (should be ~0) ──
WITH seq AS (
  SELECT flock_id, COALESCE(shed_id::text,'_flock_') AS shedk, record_date,
         opening_female,
         LAG(closing_female) OVER (PARTITION BY flock_id, COALESCE(shed_id::text,'_flock_') ORDER BY record_date) AS prev_close
  FROM public.daily_records
)
SELECT 'mismatches_after' AS check_name, COUNT(*) AS n
FROM seq WHERE prev_close IS NOT NULL AND opening_female <> prev_close;
