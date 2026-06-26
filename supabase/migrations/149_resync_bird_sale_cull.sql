-- Migration 149: Re-sync daily_records cull counts exactly from nhe_sales totals
-- Fixes any drift caused by the old incremental add/subtract approach.
-- Sets cull_female/cull_male = exact sum of nhe_sales bird quantities for each flock+date.

DO $$
DECLARE
  r RECORD;
  dr RECORD;
BEGIN
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
    SELECT id, transfer_female, transfer_male, opening_female, opening_male, mortality_female, mortality_male
    INTO dr
    FROM daily_records
    WHERE flock_id = r.flock_id AND record_date = r.sale_date
    LIMIT 1;

    IF FOUND THEN
      UPDATE daily_records SET
        cull_female   = r.total_f,
        cull_male     = r.total_m,
        trcull_female = COALESCE(dr.transfer_female, 0) + r.total_f,
        trcull_male   = COALESCE(dr.transfer_male,   0) + r.total_m,
        closing_female = GREATEST(0, COALESCE(dr.opening_female, 0)
                          - (COALESCE(dr.transfer_female, 0) + r.total_f)
                          - COALESCE(dr.mortality_female, 0)),
        closing_male   = GREATEST(0, COALESCE(dr.opening_male, 0)
                          - (COALESCE(dr.transfer_male, 0) + r.total_m)
                          - COALESCE(dr.mortality_male, 0))
      WHERE id = dr.id;
    ELSE
      INSERT INTO daily_records (
        flock_id, record_date,
        cull_female, cull_male,
        trcull_female, trcull_male,
        transfer_female, transfer_male,
        mortality_female, mortality_male
      ) VALUES (
        r.flock_id, r.sale_date,
        r.total_f, r.total_m,
        r.total_f, r.total_m,
        0, 0, 0, 0
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Done: re-synced bird sale cull counts into daily_records';
END
$$;
