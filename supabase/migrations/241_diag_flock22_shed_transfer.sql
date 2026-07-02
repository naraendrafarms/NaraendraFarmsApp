SELECT
  (SELECT id FROM public.flocks WHERE flock_no = 22 LIMIT 1) AS flock22_id,
  (SELECT count(*) FROM public.flocks WHERE flock_no = 22) AS flock22_matches,
  (SELECT count(*) FROM public.flock_transfers ft JOIN public.flocks f ON f.id=ft.flock_id WHERE f.flock_no=22) AS transfer_rows,
  (SELECT count(*) FROM public.flock_transfers ft JOIN public.flocks f ON f.id=ft.flock_id WHERE f.flock_no=22 AND ft.transfer_date='2026-06-30') AS transfers_on_jun30,
  (SELECT count(*) FROM public.daily_records dr JOIN public.flocks f ON f.id=dr.flock_id WHERE f.flock_no=22 AND dr.record_date='2026-06-30') AS daily_rows_jun30,
  (SELECT count(*) FROM public.daily_records dr JOIN public.flocks f ON f.id=dr.flock_id WHERE f.flock_no=22 AND dr.record_date='2026-07-01') AS daily_rows_jul1;
