-- Migration 991: fix 15 Flock 20 daily_records rows where farm_id disagreed
-- with the shed's real farm (labeled Kethireddypally, shed actually belongs
-- to Bodjanampet - 1). Sets farm_id = shed's own farm_id. No other column
-- touched.
UPDATE public.daily_records d
SET farm_id = s.farm_id
FROM public.flocks fl, public.sheds s
WHERE d.flock_id = fl.id AND d.shed_id = s.id
  AND fl.flock_no::text = '20'
  AND d.farm_id IS DISTINCT FROM s.farm_id;

SELECT 'f20_farmid_fixed' AS chk, count(*)::int AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text = '20' AND d.farm_id IS DISTINCT FROM s.farm_id;
