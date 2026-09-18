-- Migration 1274: Flock 24, Shed 4, 17/09/2026 has an Opening of 5,370 and NO
-- Closing, so Daily Summary's total closed at 12,186 instead of 17,556 -
-- short by exactly that shed's birds.
--
-- MEASURED (1273): the other three sheds that day balance exactly against
-- opening + received - transfer - cull - mortality. Shed 4's closing is simply
-- NULL. Every earlier day for this flock, 13/09 to 16/09, balances.
--
-- HOW IT HAPPENED: Shed 4's Opening carried forward from the previous day's
-- Closing automatically. Nobody typed into that shed, and the grid only
-- recalculates Closing when a field CHANGES - so it saved blank.
--
-- Closing is set to what the grid itself would have computed:
--   5370 + 0 - 0 - 0 - 0 = 5370
-- ONE ROW ONLY, at the owner's instruction. Other blank closings are counted
-- at the end but deliberately NOT touched.
SELECT 1 AS warmup;

DO $$
DECLARE v_id UUID;
BEGIN
  SELECT d.id INTO v_id
  FROM public.vhl_daily_entry d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds  s ON s.id = d.shed_id
  WHERE f.flock_no::text = '24' AND d.record_date = DATE '2026-09-17'
    AND s.shed_no::text = '4';

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Flock 24 / Shed 4 / 2026-09-17 row not found - nothing written';
  END IF;

  CREATE TABLE IF NOT EXISTS public.vhl_daily_closing_backup_1274 AS
  SELECT *, NOW() AS backed_up_at FROM public.vhl_daily_entry WHERE id = v_id;

  UPDATE public.vhl_daily_entry
     SET closing_female = GREATEST(0, COALESCE(opening_female,0) + COALESCE(received_female,0)
                                      - COALESCE(transfer_female,0) - COALESCE(cull_female,0)
                                      - COALESCE(mortality_female,0)),
         closing_male   = GREATEST(0, COALESCE(opening_male,0) + COALESCE(received_male,0)
                                      - COALESCE(transfer_male,0) - COALESCE(cull_male,0)
                                      - COALESCE(mortality_male,0))
   WHERE id = v_id AND closing_female IS NULL;
END $$;

-- The day now, shed by shed.
SELECT COALESCE(s.shed_no::text,'NO SHED') AS shed,
       COALESCE(d.opening_female,-1) AS open_f, COALESCE(d.received_female,-1) AS recd_f,
       COALESCE(d.mortality_female,-1) AS death_f, COALESCE(d.closing_female,-1) AS close_f
FROM public.vhl_daily_entry d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24' AND d.record_date = DATE '2026-09-17'
ORDER BY shed;

-- Does the day balance now? out_by must be 0.
SELECT sum(COALESCE(opening_female,0))::int AS open_f, sum(COALESCE(received_female,0))::int AS recd_f,
       sum(COALESCE(mortality_female,0))::int AS death_f, sum(COALESCE(closing_female,0))::int AS close_f,
       (sum(COALESCE(opening_female,0)) + sum(COALESCE(received_female,0))
        - sum(COALESCE(transfer_female,0)) - sum(COALESCE(cull_female,0))
        - sum(COALESCE(mortality_female,0)) - sum(COALESCE(closing_female,0)))::int AS out_by,
       (SELECT count(*)::int FROM public.vhl_daily_closing_backup_1274) AS rows_backed_up
FROM public.vhl_daily_entry d JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24' AND d.record_date = DATE '2026-09-17';

-- How widespread is a blank closing against a real opening? COUNTED ONLY -
-- none of these are touched.
SELECT 'vhl_daily_entry' AS tbl,
       count(*)::int AS rows_open_set_but_closing_blank,
       min(record_date)::text AS earliest, max(record_date)::text AS latest
FROM public.vhl_daily_entry
WHERE closing_female IS NULL AND COALESCE(opening_female,0) > 0
UNION ALL
SELECT 'daily_records',
       count(*)::int, min(record_date)::text, max(record_date)::text
FROM public.daily_records
WHERE closing_female IS NULL AND COALESCE(opening_female,0) > 0;
