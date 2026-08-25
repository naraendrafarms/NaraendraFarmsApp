-- Migration 917 (READ ONLY): does Flock 20 already have any shed_id IS NULL
-- (flock-level) daily_records rows? What's the app's "today" cutoff (last real
-- shed-level row) to know where the Egg sheet's real data likely stops vs
-- trailing placeholder zeros?
SELECT 'f20_flocklevel_existing' AS chk, count(*)::int AS n,
       min(d.record_date)::text AS min_date, max(d.record_date)::text AS max_date
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text = '20' AND d.shed_id IS NULL;

SELECT 'f20_shed_level_last_date' AS chk, max(d.record_date)::text AS last_date
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text = '20' AND d.remarks IS DISTINCT FROM 'F20_IMPORT_2026-08-24';
