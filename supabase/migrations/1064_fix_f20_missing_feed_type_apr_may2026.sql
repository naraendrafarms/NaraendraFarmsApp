-- Backfill feed_type_f/feed_type_m for the 427 Flock 20 rows (1 Apr - 31 May
-- 2026, remarks='F20_IMPORT_2026-08-24') that came over with feed KG but no
-- feed TYPE. Values confirmed against real evidence, not guessed:
--   feed_type_f = 'L3' -- L2 has never existed as a code anywhere in Flock 20's
--     history (all codes ever used: BCM, BGM, L1, L3, MALE, PBM). The type was
--     L1 up to the last recorded date before this gap (2025-11-22) and becomes
--     L3 the moment real data resumes (2026-06-01), with no other code between.
--     The source weekly report also shows one unchanging type ("BRE-2") for
--     every week of the gap, confirming a single type, not a transition mid-gap.
--   feed_type_m = 'MALE' -- was MALE right before the gap (2025-11-19) and
--     still MALE right after (until 2026-06-16), so no ambiguity.
UPDATE public.daily_records
SET feed_type_f = 'L3', feed_type_m = 'MALE'
WHERE remarks = 'F20_IMPORT_2026-08-24'
  AND record_date BETWEEN '2026-04-01' AND '2026-05-31'
  AND ((feed_female_kg IS NOT NULL AND feed_female_kg <> 0 AND (feed_type_f IS NULL OR feed_type_f = ''))
    OR (feed_male_kg IS NOT NULL AND feed_male_kg <> 0 AND (feed_type_m IS NULL OR feed_type_m = '')));

SELECT count(*)::int AS n_still_missing
FROM public.daily_records
WHERE remarks = 'F20_IMPORT_2026-08-24'
  AND record_date BETWEEN '2026-04-01' AND '2026-05-31'
  AND ((feed_female_kg IS NOT NULL AND feed_female_kg <> 0 AND (feed_type_f IS NULL OR feed_type_f = ''))
    OR (feed_male_kg IS NOT NULL AND feed_male_kg <> 0 AND (feed_type_m IS NULL OR feed_type_m = '')));

SELECT count(*)::int AS n_updated
FROM public.daily_records
WHERE remarks = 'F20_IMPORT_2026-08-24'
  AND record_date BETWEEN '2026-04-01' AND '2026-05-31'
  AND feed_type_f = 'L3' AND feed_type_m = 'MALE';
