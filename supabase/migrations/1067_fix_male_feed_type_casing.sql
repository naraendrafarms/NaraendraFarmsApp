-- Normalize feed_type_m casing: Flock 19 has always written this feed type as
-- "Male" (mixed case) across 1,180 rows (2025-08-10 to 2026-05-31), while
-- every other flock uses "MALE" (all caps) -- confirmed via diagnostic
-- 1066, not assumed. Same feed, two spellings splitting one type into two
-- rows on every by-feed-type report. Normalizing to MALE, the majority
-- convention. feed_type_f never has this variant, so it's untouched.
UPDATE public.daily_records
SET feed_type_m = 'MALE'
WHERE feed_type_m = 'Male';

SELECT count(*)::int AS n_updated FROM public.daily_records WHERE feed_type_m = 'MALE'
  AND flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19');
SELECT count(*)::int AS n_remaining_lowercase FROM public.daily_records WHERE feed_type_m = 'Male';
