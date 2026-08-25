SELECT
  (SELECT count(*) FROM public.flock_sheds WHERE flock_id=(SELECT id FROM public.flocks WHERE flock_no::text='19')) AS flock_sheds_n,
  (SELECT count(*) FROM public.shed_allocations WHERE flock_id=(SELECT id FROM public.flocks WHERE flock_no::text='19')) AS shed_allocations_n,
  (SELECT count(*) FROM public.flock_transfers WHERE flock_id=(SELECT id FROM public.flocks WHERE flock_no::text='19') AND to_shed_id IS NOT NULL) AS transfers_n,
  (SELECT count(DISTINCT shed_id) FROM public.daily_records WHERE flock_id=(SELECT id FROM public.flocks WHERE flock_no::text='19') AND shed_id IS NOT NULL) AS daily_records_distinct_n;
