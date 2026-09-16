-- Read-only, and deliberately COUNT-based. Migration 1246's last statement
-- printed nothing, and run_sql.py omits a statement that returns no rows - so
-- "no output" is ambiguous between "no rows" and "not printed". A COUNT always
-- returns exactly one row, so the answer cannot be mistaken either way.
SELECT 1 AS warmup;

SELECT (SELECT count(*) FROM public.vhl_daily_entry
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24'))::int AS rows_for_flock_24,
       (SELECT count(*) FROM public.vhl_daily_entry
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24')
          AND record_date = '2026-09-14')::int AS rows_on_14_09,
       (SELECT COALESCE(sum(received_female), 0) FROM public.vhl_daily_entry
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24'))::int AS received_female_total,
       (SELECT count(*) FROM public.vhl_daily_entry)::int AS vhl_daily_rows_all_flocks,
       (SELECT count(*) FROM public.daily_records
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24'))::int AS rows_in_ORDINARY_daily_records;
