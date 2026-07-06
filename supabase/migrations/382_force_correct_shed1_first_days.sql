-- Migration 382: re-assert the known-correct values for Shed 1's first two
-- days directly (idempotent UPDATE), rather than relying on the flaky
-- migration-verification channel. Source: user-supplied Excel, Flock sheet,
-- rows 4 (07-Jul-2025) and 10 (08-Jul-2025).

UPDATE vhl_daily_entry v
SET opening_female = 0, opening_male = 0, received_female = 1490, received_male = 0,
    closing_female = 1490, closing_male = 0, feed_female_kg = 0, feed_male_kg = 0
FROM flocks fl, sheds sh
WHERE v.flock_id = fl.id AND v.shed_id = sh.id
  AND fl.flock_no = 21 AND fl.is_vhl_contract = true
  AND sh.shed_no = 1 AND v.record_date = '2025-07-07';

UPDATE vhl_daily_entry v
SET opening_female = 1490, opening_male = 0, received_female = 3000, received_male = 0,
    closing_female = 4490, closing_male = 0, feed_female_kg = 148, feed_male_kg = 0
FROM flocks fl, sheds sh
WHERE v.flock_id = fl.id AND v.shed_id = sh.id
  AND fl.flock_no = 21 AND fl.is_vhl_contract = true
  AND sh.shed_no = 1 AND v.record_date = '2025-07-08';
