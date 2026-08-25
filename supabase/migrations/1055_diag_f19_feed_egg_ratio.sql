SELECT
  count(*)::int AS n_rows,
  count(*) FILTER (WHERE feed_female_kg IS NOT NULL OR feed_male_kg IS NOT NULL)::int AS n_rows_with_feed,
  round(sum(COALESCE(feed_female_kg,0)+COALESCE(feed_male_kg,0))::numeric,1) AS total_feed_kg,
  sum(COALESCE(he_eggs,0)+COALESCE(je_eggs,0)+COALESCE(te_eggs,0)+COALESCE(be_eggs,0)+COALESCE(le_eggs,0))::int AS total_eggs,
  min(record_date)::text AS first_date,
  max(record_date)::text AS last_date,
  count(*) FILTER (WHERE shed_id IS NULL)::int AS n_flocklevel_rows,
  count(*) FILTER (WHERE shed_id IS NOT NULL)::int AS n_shed_rows
FROM public.daily_records
WHERE flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2'::uuid;
