SELECT id, flock_no FROM public.flocks WHERE flock_no = 22;
SELECT count(*) AS n FROM public.flock_transfers;
SELECT count(*) AS n FROM public.daily_records WHERE record_date IN ('2026-06-30','2026-07-01');
