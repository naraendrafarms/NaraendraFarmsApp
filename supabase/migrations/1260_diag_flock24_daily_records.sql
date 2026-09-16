-- READ ONLY. Reports - Daily Summary reads daily_records and never
-- vhl_daily_entry. Confirm Flock 24 genuinely has no daily_records rows, so
-- the all-zero block is "wrong table" rather than "data missing".
SELECT 1 AS warmup;

SELECT (SELECT count(*)::int FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
          WHERE f.flock_no::text='24')                                   AS daily_records_rows_flock24,
       (SELECT count(*)::int FROM public.vhl_daily_entry d JOIN public.flocks f ON f.id=d.flock_id
          WHERE f.flock_no::text='24')                                   AS vhl_daily_entry_rows_flock24,
       (SELECT count(*)::int FROM public.medicine_usage m JOIN public.flocks f ON f.id=m.flock_id
          WHERE f.flock_no::text='24')                                   AS medicine_usage_rows_flock24,
       (SELECT count(*)::int FROM public.vhl_medicine_usage u JOIN public.flocks f ON f.id=u.flock_id
          WHERE f.flock_no::text='24')                                   AS vhl_medicine_rows_flock24;

-- How many VHL flocks would this report pick up at all, now and in general.
SELECT count(*)::int AS vhl_flocks_in_rearing_or_laying,
       string_agg(flock_no::text, ', ' ORDER BY flock_no) AS which
FROM public.flocks
WHERE is_vhl_contract = true AND status IN ('rearing','laying');
