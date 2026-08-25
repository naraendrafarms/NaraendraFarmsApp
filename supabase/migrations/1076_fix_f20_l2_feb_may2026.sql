-- Correct Flock 20 feed_type for 2026-02-07 to 2026-05-17: per the source
-- Excel (Feed sheet, "Type OF Feed" column), this whole span is L2 (L3
-- starts only from 2026-05-18). Migration 1064 had wrongly set the
-- 2026-04-01..05-17 portion to L3, and 2026-02-07..03-31 was never filled
-- at all (feed_type_f/feed_type_m NULL since import).
UPDATE public.daily_records
SET feed_type_f = 'L2', feed_type_m = 'MALE'
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND record_date BETWEEN '2026-02-07' AND '2026-05-17'
  AND ((feed_female_kg IS NOT NULL AND feed_female_kg <> 0)
    OR (feed_male_kg IS NOT NULL AND feed_male_kg <> 0));

SELECT feed_type_f, count(*)::int AS n_rows, min(record_date)::text AS first_date, max(record_date)::text AS last_date
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND record_date BETWEEN '2026-02-07' AND '2026-05-17'
GROUP BY feed_type_f
ORDER BY feed_type_f;
