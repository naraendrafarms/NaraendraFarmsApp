SELECT count(*) AS total_transfers,
  count(*) FILTER (WHERE flock_id IS NOT NULL) AS tagged_to_flock,
  count(*) FILTER (WHERE flock_id IS NULL) AS not_tagged
FROM public.feed_transfers;
