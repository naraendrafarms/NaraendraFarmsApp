-- Migration 150: Fix multi-shed cull double-counting
-- For each flock+date that has multiple shed daily_records,
-- ensure cull is only on the first (lowest id) record; zero it on others.
-- Then re-sync first record's cull from nhe_sales totals.

DO $$
DECLARE
  r RECORD;
  first_dr RECORD;
  other_dr RECORD;
  sale_f INTEGER;
  sale_m INTEGER;
BEGIN
  -- Find all flock+date combos with more than one daily_record
  FOR r IN
    SELECT flock_id, record_date
    FROM daily_records
    GROUP BY flock_id, record_date
    HAVING COUNT(*) > 1
  LOOP
    -- Zero cull on all records except the first (lowest id)
    FOR other_dr IN
      SELECT id, transfer_female, transfer_male, opening_female, opening_male, mortality_female, mortality_male
      FROM daily_records
      WHERE flock_id = r.flock_id AND record_date = r.record_date
      ORDER BY id
      OFFSET 1
    LOOP
      UPDATE daily_records SET
        cull_female   = 0,
        cull_male     = 0,
        trcull_female = COALESCE(other_dr.transfer_female, 0),
        trcull_male   = COALESCE(other_dr.transfer_male, 0),
        closing_female = GREATEST(0, COALESCE(other_dr.opening_female, 0)
                          - COALESCE(other_dr.transfer_female, 0)
                          - COALESCE(other_dr.mortality_female, 0)),
        closing_male   = GREATEST(0, COALESCE(other_dr.opening_male, 0)
                          - COALESCE(other_dr.transfer_male, 0)
                          - COALESCE(other_dr.mortality_male, 0))
      WHERE id = other_dr.id;
    END LOOP;
  END LOOP;

  -- Now re-sync first record's cull from nhe_sales for all flock+dates with bird sales
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
    INTO first_dr
    FROM daily_records
    WHERE flock_id = r.flock_id AND record_date = r.sale_date
    ORDER BY id LIMIT 1;

    IF FOUND THEN
      UPDATE daily_records SET
        cull_female   = r.total_f,
        cull_male     = r.total_m,
        trcull_female = COALESCE(first_dr.transfer_female, 0) + r.total_f,
        trcull_male   = COALESCE(first_dr.transfer_male,   0) + r.total_m,
        closing_female = GREATEST(0, COALESCE(first_dr.opening_female, 0)
                          - (COALESCE(first_dr.transfer_female, 0) + r.total_f)
                          - COALESCE(first_dr.mortality_female, 0)),
        closing_male   = GREATEST(0, COALESCE(first_dr.opening_male, 0)
                          - (COALESCE(first_dr.transfer_male, 0) + r.total_m)
                          - COALESCE(first_dr.mortality_male, 0))
      WHERE id = first_dr.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Done: fixed multi-shed cull double-counting';
END
$$;
