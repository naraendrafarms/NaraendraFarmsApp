-- Migration 148: Backfill daily_records cull counts from NHE bird sales
-- For each bird sale (lame/cull) that exists in nhe_sales, ensure the
-- corresponding daily_record row has cull_female/cull_male >= qty sold.
-- We use MAX(existing_cull, sum_of_bird_sales) so we never reduce a cull
-- that was entered higher (some birds may have been culled but not sold).

DO $$
DECLARE
  r RECORD;
  dr RECORD;
  sale_cull_f INTEGER;
  sale_cull_m INTEGER;
  new_cull_f INTEGER;
  new_cull_m INTEGER;
  new_trcull_f INTEGER;
  new_trcull_m INTEGER;
BEGIN
  -- Loop over all distinct flock+date combos that have bird sales
  FOR r IN
    SELECT
      flock_id,
      sale_date,
      COALESCE(SUM(CASE WHEN bird_sex IN ('female','sex_error') OR bird_sex IS NULL THEN quantity ELSE 0 END), 0)::INTEGER AS total_f,
      COALESCE(SUM(CASE WHEN bird_sex = 'male' THEN quantity ELSE 0 END), 0)::INTEGER AS total_m
    FROM nhe_sales
    WHERE sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
      AND quantity > 0
    GROUP BY flock_id, sale_date
  LOOP
    sale_cull_f := r.total_f;
    sale_cull_m := r.total_m;

    -- Check if daily record exists for this flock + date
    SELECT id, cull_female, cull_male, transfer_female, transfer_male,
           opening_female, opening_male, mortality_female, mortality_male
    INTO dr
    FROM daily_records
    WHERE flock_id = r.flock_id AND record_date = r.sale_date
    LIMIT 1;

    IF FOUND THEN
      -- Only increase, never decrease existing cull entries
      new_cull_f := GREATEST(COALESCE(dr.cull_female, 0), sale_cull_f);
      new_cull_m := GREATEST(COALESCE(dr.cull_male, 0), sale_cull_m);
      new_trcull_f := COALESCE(dr.transfer_female, 0) + new_cull_f;
      new_trcull_m := COALESCE(dr.transfer_male, 0) + new_cull_m;

      UPDATE daily_records SET
        cull_female   = new_cull_f,
        cull_male     = new_cull_m,
        trcull_female = new_trcull_f,
        trcull_male   = new_trcull_m,
        closing_female = GREATEST(0, COALESCE(opening_female, 0) - new_trcull_f - COALESCE(mortality_female, 0)),
        closing_male   = GREATEST(0, COALESCE(opening_male, 0)   - new_trcull_m - COALESCE(mortality_male, 0))
      WHERE id = dr.id;
    ELSE
      -- No daily record for this date — create a minimal one with just cull
      INSERT INTO daily_records (
        flock_id, record_date,
        cull_female, cull_male,
        trcull_female, trcull_male,
        transfer_female, transfer_male,
        mortality_female, mortality_male
      ) VALUES (
        r.flock_id, r.sale_date,
        sale_cull_f, sale_cull_m,
        sale_cull_f, sale_cull_m,
        0, 0, 0, 0
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Done: backfilled bird sale cull counts into daily_records';
END
$$;
